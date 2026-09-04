from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
from operator import add
from typing import Annotated, Any, Awaitable, Callable, Optional, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send

from ..capabilities.question_quality import QuestionQualityCapability
from .contracts import ExecutionPlan, QuestionTask


logger = logging.getLogger(__name__)

Dispatch = Callable[[str, dict[str, Any]], Awaitable[str]]
WorkerInvoker = Callable[[str, str, dict[str, Any]], Awaitable[dict[str, Any]]]
ImageSearcher = Callable[[str, int], Awaitable[list[dict[str, str]]]]
Trace = Callable[[str, str, str], Awaitable[None]]


class AuthoringState(TypedDict, total=False):
    user_input: str
    plan: dict[str, Any]
    categories: Any
    base_payload: dict[str, Any]
    curriculum: dict[str, Any]
    question_tasks: list[dict[str, Any]]
    current_task: dict[str, Any]
    question_batches: Annotated[list[dict[str, Any]], add]
    questions: list[dict[str, Any]]
    quality: dict[str, Any]
    revision_count: int
    media: dict[str, Any]
    final_payload: dict[str, Any]
    errors: Annotated[list[str], add]


class AuthoringGraphError(RuntimeError):
    pass


class AuthoringSupervisorGraph:
    """Controlled supervisor graph for complex quiz authoring.

    Agents only return typed artifacts. Database writes remain behind the
    existing approval-aware dispatch callback owned by AIAgentCore.
    """

    def __init__(
        self,
        *,
        invoke_worker: WorkerInvoker,
        dispatch: Dispatch,
        search_images: ImageSearcher,
        build_base_payload: Callable[[Any], Optional[dict[str, Any]]],
        trace: Trace,
        max_questions_per_worker: int = 4,
        media_concurrency: int = 4,
        media_timeout_seconds: float = 6.0,
        default_question_count: int = 8,
        max_revisions: int = 2,
    ) -> None:
        self.invoke_worker = invoke_worker
        self.dispatch = dispatch
        self.search_images = search_images
        self.build_base_payload = build_base_payload
        self.trace = trace
        self.max_questions_per_worker = max(1, min(max_questions_per_worker, 20))
        self.media_concurrency = max(1, min(media_concurrency, 16))
        self.media_timeout_seconds = max(1.0, min(media_timeout_seconds, 30.0))
        self.default_question_count = max(1, min(default_question_count, 100))
        self.max_revisions = max(0, min(max_revisions, 5))

    async def run(
        self,
        *,
        user_input: str,
        plan: dict[str, Any],
    ) -> dict[str, Any]:
        execution_plan = self._execution_plan(plan)
        graph = self._build_graph(execution_plan)
        state = await graph.ainvoke({
            "user_input": user_input,
            "plan": plan,
            "question_batches": [],
            "errors": [],
            "revision_count": 0,
        })
        if state.get("errors"):
            raise AuthoringGraphError(str(state["errors"][0]))
        payload = state.get("final_payload")
        if not isinstance(payload, dict):
            raise AuthoringGraphError("SUPERVISOR_FINALIZER_EMPTY: Không tạo được payload quiz.")
        return payload

    def _execution_plan(self, plan: dict[str, Any]) -> ExecutionPlan:
        entities = plan.get("entities") if isinstance(plan.get("entities"), dict) else {}
        question_count = int(entities.get("question_count") or self.default_question_count)
        content_language = str(
            entities.get("content_language") or plan.get("content_language") or "auto"
        )
        return ExecutionPlan(
            plan_id=hashlib.sha256(
                json.dumps(plan, ensure_ascii=False, sort_keys=True, default=str).encode("utf-8")
            ).hexdigest()[:24],
            workflow="quiz_authoring",
            content_language=content_language,
            question_count=max(1, min(question_count, 100)),
            max_revisions=self.max_revisions,
            required_roles=["curriculum", "quiz_builder", "quality_reviewer", "media_retriever", "finalizer"],
            metadata={"intent": str(plan.get("intent") or "quiz_create")},
        )

    def _build_graph(self, execution_plan: ExecutionPlan):
        builder = StateGraph(AuthoringState)

        async def retrieve_categories(state: AuthoringState) -> dict[str, Any]:
            await self.trace("category_retriever", "start", "list_categories")
            raw = await self.dispatch("list_categories", {})
            result = _decode_dispatch_result(raw)
            await self.trace("category_retriever", "completed", "list_categories")
            return {"categories": result}

        async def build_payload(state: AuthoringState) -> dict[str, Any]:
            payload = self.build_base_payload(state.get("categories"))
            if payload is None:
                return {"errors": ["CATEGORY_NOT_FOUND: Không tìm thấy category phù hợp trong database."]}
            await self.trace("supervisor", "base_payload_ready", "category")
            return {"base_payload": payload}

        async def curriculum(state: AuthoringState) -> dict[str, Any]:
            await self.trace("curriculum", "start", "curriculum")
            result = await self.invoke_worker(
                "curriculum",
                self._curriculum_prompt(execution_plan),
                {
                    "user_request": state["user_input"],
                    "interaction_plan": state["plan"],
                    "question_count": execution_plan.question_count,
                    "content_language": execution_plan.content_language,
                },
            )
            blueprint = result.get("blueprint")
            if not isinstance(blueprint, list) or not blueprint:
                return {"errors": ["CURRICULUM_INVALID: Curriculum worker không trả blueprint hợp lệ."]}
            await self.trace("curriculum", "completed", "curriculum")
            return {"curriculum": {"blueprint": blueprint[:execution_plan.question_count]}}

        def build_tasks(state: AuthoringState) -> dict[str, Any]:
            blueprint = (state.get("curriculum") or {}).get("blueprint") or []
            tasks: list[dict[str, Any]] = []
            for start in range(0, len(blueprint), self.max_questions_per_worker):
                chunk = blueprint[start:start + self.max_questions_per_worker]
                slots = [int(item.get("slot") or index + start + 1) for index, item in enumerate(chunk)]
                fingerprint = hashlib.sha256(
                    json.dumps(chunk, ensure_ascii=False, sort_keys=True, default=str).encode("utf-8")
                ).hexdigest()[:24]
                task = QuestionTask(
                    task_id=f"question-shard-{start // self.max_questions_per_worker + 1}",
                    slots=slots,
                    blueprint=chunk,
                    task_fingerprint=fingerprint,
                )
                tasks.append(task.model_dump())
            return {"question_tasks": tasks}

        def fan_out(state: AuthoringState) -> list[Send]:
            return [Send("generate_questions", {
                "current_task": task,
                "user_input": state["user_input"],
                "plan": state["plan"],
                "base_payload": state.get("base_payload", {}),
            }) for task in state.get("question_tasks", [])]

        async def generate_questions(state: AuthoringState) -> dict[str, Any]:
            task = state.get("current_task") or {}
            await self.trace("quiz_builder", "start", str(task.get("task_id") or "unknown"))
            result = await self.invoke_worker(
                "quiz_builder",
                self._generator_prompt(execution_plan),
                {
                    "user_request": state["user_input"],
                    "task": task,
                    "content_language": execution_plan.content_language,
                },
            )
            questions = result.get("questions")
            if not isinstance(questions, list) or not questions:
                return {"errors": [f"GENERATOR_INVALID: {task.get('task_id')} không trả questions hợp lệ."]}
            normalized = []
            for question in questions:
                if isinstance(question, dict):
                    item = dict(question)
                    if not item.get("sort_order") and task.get("slots"):
                        item["sort_order"] = task["slots"][len(normalized)] if len(normalized) < len(task["slots"]) else len(normalized) + 1
                    normalized.append(item)
            await self.trace("quiz_builder", "completed", str(task.get("task_id") or "unknown"))
            return {"question_batches": [{"task_id": task.get("task_id"), "questions": normalized}]}

        def aggregate(state: AuthoringState) -> dict[str, Any]:
            questions: list[dict[str, Any]] = []
            for batch in state.get("question_batches", []):
                for question in batch.get("questions", []) if isinstance(batch, dict) else []:
                    if isinstance(question, dict):
                        questions.append(question)
            questions.sort(key=lambda item: int(item.get("sort_order") or 0))
            return {"questions": questions}

        def validate(state: AuthoringState) -> dict[str, Any]:
            payload = {**state.get("base_payload", {}), "questions": state.get("questions", [])}
            report = QuestionQualityCapability.inspect_quiz(payload)
            return {"quality": report.model_dump(mode="json")}

        async def repair(state: AuthoringState) -> dict[str, Any]:
            next_revision = int(state.get("revision_count") or 0) + 1
            await self.trace("quality_reviewer", "repair_start", f"revision-{next_revision}")
            result = await self.invoke_worker(
                "quiz_builder",
                self._repair_prompt(execution_plan),
                {
                    "user_request": state["user_input"],
                    "questions": state.get("questions", []),
                    "quality_report": state.get("quality", {}),
                    "revision": next_revision,
                    "content_language": execution_plan.content_language,
                },
            )
            questions = result.get("questions")
            if not isinstance(questions, list) or not questions:
                return {"revision_count": next_revision, "errors": ["REPAIR_INVALID: Repair worker không trả questions hợp lệ."]}
            await self.trace("quality_reviewer", "repair_completed", f"revision-{next_revision}")
            return {"questions": [item for item in questions if isinstance(item, dict)], "revision_count": next_revision}

        async def media(state: AuthoringState) -> dict[str, Any]:
            questions = state.get("questions", [])
            base = dict(state.get("base_payload", {}))
            semaphore = asyncio.Semaphore(self.media_concurrency)

            async def one(query: str) -> Optional[str]:
                async with semaphore:
                    try:
                        result = await asyncio.wait_for(
                            self.search_images(query, 1),
                            timeout=self.media_timeout_seconds,
                        )
                        return str(result[0].get("image_url") or "").strip() if result else None
                    except Exception as exc:
                        logger.warning("supervisor_media_failed error=%s", type(exc).__name__)
                        return None

            await self.trace("media_retriever", "start", "fanout")
            title_query = " ".join(
                str(base.get(key) or "").strip()
                for key in ("title", "description")
                if base.get(key)
            )
            thumbnail, *question_urls = await asyncio.gather(
                one(title_query or state["user_input"]),
                *(one(str(question.get("question_text") or "question")) for question in questions),
            )
            enriched_questions = []
            for question, image_url in zip(questions, question_urls):
                enriched_questions.append({
                    **question,
                    **({"media_url": image_url} if image_url and not question.get("media_url") else {}),
                })
            media_payload = {"questions": enriched_questions}
            if thumbnail:
                media_payload["thumbnail_url"] = thumbnail
            await self.trace("media_retriever", "completed", "fanout")
            return {"media": media_payload}

        async def finalize(state: AuthoringState) -> dict[str, Any]:
            quality = state.get("quality") or {}
            if not quality.get("passed"):
                return {"errors": ["QUESTION_QUALITY_FAILED: Không thể tạo quiz sau giới hạn repair."]}
            base = dict(state.get("base_payload", {}))
            media_payload = state.get("media") or {}
            questions = media_payload.get("questions") or state.get("questions", [])
            payload = {**base, "questions": questions}
            if media_payload.get("thumbnail_url"):
                payload["thumbnail_url"] = media_payload["thumbnail_url"]
            await self.trace("finalizer", "start", "create_quiz_with_questions")
            raw = await self.dispatch("create_quiz_with_questions", payload)
            _decode_dispatch_result(raw)
            await self.trace("finalizer", "completed", "create_quiz_with_questions")
            return {"final_payload": payload}

        def after_validate(state: AuthoringState) -> str:
            quality = state.get("quality") or {}
            if quality.get("passed"):
                return "media"
            if int(state.get("revision_count") or 0) < execution_plan.max_revisions:
                return "repair"
            return "finalize"

        builder.add_node("retrieve_categories", retrieve_categories)
        builder.add_node("build_payload", build_payload)
        builder.add_node("curriculum", curriculum)
        builder.add_node("build_tasks", build_tasks)
        builder.add_node("generate_questions", generate_questions)
        builder.add_node("aggregate", aggregate)
        builder.add_node("validate", validate)
        builder.add_node("repair", repair)
        builder.add_node("media", media)
        builder.add_node("finalize", finalize)
        builder.add_edge(START, "retrieve_categories")
        builder.add_edge("retrieve_categories", "build_payload")
        builder.add_edge("build_payload", "curriculum")
        builder.add_edge("curriculum", "build_tasks")
        builder.add_conditional_edges("build_tasks", fan_out, ["generate_questions"])
        builder.add_edge("generate_questions", "aggregate")
        builder.add_edge("aggregate", "validate")
        builder.add_conditional_edges(
            "validate",
            after_validate,
            {"repair": "repair", "media": "media", "finalize": "finalize"},
        )
        builder.add_edge("repair", "validate")
        builder.add_edge("media", "finalize")
        builder.add_edge("finalize", END)
        return builder.compile()

    @staticmethod
    def _curriculum_prompt(plan: ExecutionPlan) -> str:
        return (
            "You are the curriculum agent in a controlled quiz authoring workflow. "
            "Return JSON only with a blueprint array. Create exactly the requested "
            f"{plan.question_count} slots. Each slot must contain slot, objective, "
            "difficulty_level and question_type. Do not write prose outside JSON. "
            "Do not create answers or call tools."
        )

    @staticmethod
    def _generator_prompt(plan: ExecutionPlan) -> str:
        return (
            "You are a quiz builder worker. Generate only the assigned blueprint slots "
            "and return JSON only: {\"questions\": [...]}. Every question must have "
            "question_text, question_type, options, points, explanation, sort_order. "
            "Each option must have option_text, is_correct and sort_order. Preserve the "
            f"requested content language ({plan.content_language}). Do not add extra slots."
        )

    @staticmethod
    def _repair_prompt(plan: ExecutionPlan) -> str:
        return (
            "You are a quiz repair worker. Return JSON only: {\"questions\": [...]}. "
            "Repair the supplied questions according to the quality report. Preserve "
            "valid fields and sort_order, do not change the requested content language "
            f"({plan.content_language}), and do not add unrelated questions."
        )


def _decode_dispatch_result(raw: str) -> Any:
    try:
        payload = json.loads(raw)
    except (TypeError, ValueError):
        raise AuthoringGraphError("TOOL_RESULT_INVALID: Tool không trả JSON hợp lệ.")
    if isinstance(payload, dict) and payload.get("ok") is False:
        raise AuthoringGraphError(str(payload.get("error") or "TOOL_FAILED"))
    return payload.get("result") if isinstance(payload, dict) and "result" in payload else payload
