from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
import unicodedata
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
TaskEvent = Callable[[str, str, str, dict[str, Any]], Awaitable[None]]
ArtifactStore = Callable[[str, str, dict[str, Any]], Awaitable[Optional[str]]]
QualityReviewer = Callable[[list[dict[str, Any]]], Awaitable[dict[str, Any]]]


class AuthoringState(TypedDict, total=False):
    user_input: str
    plan: dict[str, Any]
    categories: Any
    base_payload: dict[str, Any]
    curriculum: dict[str, Any]
    question_tasks: list[dict[str, Any]]
    retry_task_id: str
    current_task: dict[str, Any]
    question_batches: Annotated[list[dict[str, Any]], add]
    questions: list[dict[str, Any]]
    quality: dict[str, Any]
    semantic_review: dict[str, Any]
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
        task_event: Optional[TaskEvent] = None,
        artifact_store: Optional[ArtifactStore] = None,
        quality_reviewer: Optional[QualityReviewer] = None,
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
        self.task_event = task_event
        self.artifact_store = artifact_store
        self.quality_reviewer = quality_reviewer

    async def _task(self, task_id: str, role: str, status: str, **metadata: Any) -> None:
        if self.task_event is not None:
            await self.task_event(task_id, role, status, metadata)

    async def _artifact(self, task_id: str, artifact_type: str, payload: dict[str, Any]) -> None:
        if self.artifact_store is not None:
            await self.artifact_store(task_id, artifact_type, payload)

    async def run(
        self,
        *,
        user_input: str,
        plan: dict[str, Any],
        resume_state: Optional[dict[str, Any]] = None,
        retry_task_id: Optional[str] = None,
    ) -> dict[str, Any]:
        execution_plan = self._execution_plan(plan)
        graph = self._build_graph(execution_plan)
        initial_state: AuthoringState = {
            "user_input": user_input,
            "plan": plan,
            "question_batches": [],
            "errors": [],
            "revision_count": 0,
        }
        if isinstance(resume_state, dict):
            for key in ("categories", "base_payload", "curriculum", "question_batches"):
                if key in resume_state:
                    initial_state[key] = resume_state[key]
        if retry_task_id:
            initial_state["retry_task_id"] = retry_task_id  # type: ignore[typeddict-item]
        state = await graph.ainvoke(initial_state)
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
            if state.get("categories") is not None:
                return {}
            await self._task("categories", "category_retriever", "running")
            await self.trace("category_retriever", "start", "list_categories")
            try:
                raw = await self.dispatch("list_categories", {})
                result = _decode_dispatch_result(raw)
            except Exception as exc:
                await self._task("categories", "category_retriever", "retryable_failed", error=str(exc))
                raise
            await self._artifact("categories", "category_list", result if isinstance(result, dict) else {"items": result})
            await self._task("categories", "category_retriever", "completed")
            await self.trace("category_retriever", "completed", "list_categories")
            return {"categories": result}

        async def build_payload(state: AuthoringState) -> dict[str, Any]:
            if state.get("base_payload"):
                return {}
            payload = self.build_base_payload(state.get("categories"))
            if payload is None:
                return {"errors": ["CATEGORY_NOT_FOUND: Không tìm thấy category phù hợp trong database."]}
            await self._artifact("base-payload", "quiz_base_payload", payload)
            await self.trace("supervisor", "base_payload_ready", "category")
            return {"base_payload": payload}

        async def curriculum(state: AuthoringState) -> dict[str, Any]:
            if state.get("curriculum"):
                return {}
            await self._task("curriculum", "curriculum", "running")
            await self.trace("curriculum", "start", "curriculum")
            try:
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
            except Exception as exc:
                await self._task("curriculum", "curriculum", "retryable_failed", error=str(exc))
                raise
            blueprint = result.get("blueprint")
            if not isinstance(blueprint, list) or not blueprint:
                await self._task("curriculum", "curriculum", "retryable_failed", error="CURRICULUM_INVALID")
                return {"errors": ["CURRICULUM_INVALID: Curriculum worker không trả blueprint hợp lệ."]}
            await self._artifact("curriculum", "quiz_blueprint", {"blueprint": blueprint})
            await self._task("curriculum", "curriculum", "completed")
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
            retry_task_id = str(state.get("retry_task_id") or "")
            if retry_task_id:
                tasks = [task for task in tasks if task.get("task_id") == retry_task_id]
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
            task_id = str(task.get("task_id") or "unknown")
            await self._task(task_id, "quiz_builder", "running", task_fingerprint=task.get("task_fingerprint", ""))
            await self.trace("quiz_builder", "start", str(task.get("task_id") or "unknown"))
            try:
                result = await self.invoke_worker(
                    "quiz_builder",
                    self._generator_prompt(execution_plan),
                    {
                        "user_request": state["user_input"],
                        "task": task,
                        "content_language": execution_plan.content_language,
                    },
                )
            except Exception as exc:
                if "WORKER_OUTPUT_INVALID" in str(exc):
                    await self._task(task_id, "quiz_builder", "retrying", error="structured_output_recovery")
                    try:
                        result = await self.invoke_worker(
                            "quiz_builder",
                            self._generator_prompt(execution_plan)
                            + " Return a JSON object with a top-level questions array. Do not return an array, markdown or prose.",
                            {
                                "user_request": state["user_input"],
                                "task": task,
                                "content_language": execution_plan.content_language,
                            },
                        )
                    except Exception as retry_exc:
                        await self._task(task_id, "quiz_builder", "retryable_failed", error=str(retry_exc))
                        raise
                else:
                    await self._task(task_id, "quiz_builder", "retryable_failed", error=str(exc))
                    raise
            questions = result.get("questions")
            if not isinstance(questions, list) or not questions:
                await self._task(task_id, "quiz_builder", "retryable_failed", error="GENERATOR_INVALID")
                return {"errors": [f"GENERATOR_INVALID: {task.get('task_id')} không trả questions hợp lệ."]}
            normalized = []
            for question in questions:
                if isinstance(question, dict):
                    item = dict(question)
                    if not item.get("sort_order") and task.get("slots"):
                        item["sort_order"] = task["slots"][len(normalized)] if len(normalized) < len(task["slots"]) else len(normalized) + 1
                    normalized.append(item)
            await self._artifact(task_id, "question_batch", {"questions": normalized, "slots": task.get("slots", [])})
            await self._task(task_id, "quiz_builder", "completed", artifact_type="question_batch")
            await self.trace("quiz_builder", "completed", str(task.get("task_id") or "unknown"))
            return {"question_batches": [{"task_id": task.get("task_id"), "questions": normalized}]}

        def aggregate(state: AuthoringState) -> dict[str, Any]:
            questions: list[dict[str, Any]] = []
            for batch in state.get("question_batches", []):
                for question in batch.get("questions", []) if isinstance(batch, dict) else []:
                    if isinstance(question, dict):
                        questions.append(_normalize_generated_question(question))
            questions.sort(key=lambda item: int(item.get("sort_order") or 0))
            return {"questions": questions}

        def validate(state: AuthoringState) -> dict[str, Any]:
            payload = {**state.get("base_payload", {}), "questions": state.get("questions", [])}
            report = QuestionQualityCapability.inspect_quiz(payload)
            return {"quality": report.model_dump(mode="json")}

        async def review(state: AuthoringState) -> dict[str, Any]:
            await self._task("quality-review", "quality_reviewer", "running")
            if self.quality_reviewer is None:
                result = {"passed": True, "findings": [], "reviewer": "deterministic-fallback"}
            else:
                try:
                    result = await self.quality_reviewer(state.get("questions", []))
                except Exception as exc:
                    await self._task("quality-review", "quality_reviewer", "retryable_failed", error=str(exc))
                    return {"semantic_review": {"passed": False, "findings": [str(exc)], "retryable": True}}
            await self._artifact("quality-review", "quality_report", result)
            await self._task("quality-review", "quality_reviewer", "completed", reviewer=result.get("reviewer", "unknown"))
            return {"semantic_review": result}

        async def repair(state: AuthoringState) -> dict[str, Any]:
            next_revision = int(state.get("revision_count") or 0) + 1
            task_id = f"repair-{next_revision}"
            await self._task(task_id, "quiz_builder", "running", revision=next_revision)
            await self.trace("quality_reviewer", "repair_start", f"revision-{next_revision}")
            try:
                result = await self.invoke_worker(
                    "quiz_builder",
                    self._repair_prompt(execution_plan),
                    {
                        "user_request": state["user_input"],
                        "questions": state.get("questions", []),
                        "quality_report": state.get("quality", {}),
                        "semantic_review": state.get("semantic_review", {}),
                        "revision": next_revision,
                        "content_language": execution_plan.content_language,
                    },
                )
            except Exception as exc:
                await self._task(task_id, "quiz_builder", "retryable_failed", error=str(exc))
                raise
            questions = result.get("questions")
            if not isinstance(questions, list) or not questions:
                await self._task(task_id, "quiz_builder", "retryable_failed", error="REPAIR_INVALID")
                return {"revision_count": next_revision, "errors": ["REPAIR_INVALID: Repair worker không trả questions hợp lệ."]}
            await self._artifact(task_id, "repaired_questions", {"questions": questions})
            await self._task(task_id, "quiz_builder", "completed", artifact_type="repaired_questions")
            await self.trace("quality_reviewer", "repair_completed", f"revision-{next_revision}")
            return {
                "questions": [_normalize_generated_question(item) for item in questions if isinstance(item, dict)],
                "revision_count": next_revision,
            }

        async def media(state: AuthoringState) -> dict[str, Any]:
            await self._task("media", "media_retriever", "running")
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
            await self._artifact("media", "media_manifest", media_payload)
            await self._task("media", "media_retriever", "completed")
            await self.trace("media_retriever", "completed", "fanout")
            return {"media": media_payload}

        async def finalize(state: AuthoringState) -> dict[str, Any]:
            await self._task("finalizer", "finalizer", "running")
            quality = state.get("quality") or {}
            review_result = state.get("semantic_review") or {}
            if not quality.get("passed") or not review_result.get("passed"):
                await self._task("finalizer", "finalizer", "blocked", error="QUESTION_QUALITY_FAILED")
                return {"errors": ["QUESTION_QUALITY_FAILED: Không thể tạo quiz sau giới hạn repair."]}
            base = dict(state.get("base_payload", {}))
            media_payload = state.get("media") or {}
            questions = media_payload.get("questions") or state.get("questions", [])
            payload = {**base, "questions": questions}
            if media_payload.get("thumbnail_url"):
                payload["thumbnail_url"] = media_payload["thumbnail_url"]
            await self.trace("finalizer", "start", "create_quiz_with_questions")
            try:
                raw = await self.dispatch("create_quiz_with_questions", payload)
                _decode_dispatch_result(raw)
            except Exception as exc:
                await self._task("finalizer", "finalizer", "retryable_failed", error=str(exc))
                raise
            await self._artifact("finalizer", "quiz_proposal", payload)
            await self._task("finalizer", "finalizer", "completed", artifact_type="quiz_proposal")
            await self.trace("finalizer", "completed", "create_quiz_with_questions")
            return {"final_payload": payload}

        def after_validate(state: AuthoringState) -> str:
            quality = state.get("quality") or {}
            if quality.get("passed"):
                return "review"
            if int(state.get("revision_count") or 0) < execution_plan.max_revisions:
                return "repair"
            return "finalize"

        def after_review(state: AuthoringState) -> str:
            review_result = state.get("semantic_review") or {}
            if review_result.get("passed"):
                return "media"
            if review_result.get("retryable"):
                return "repair" if int(state.get("revision_count") or 0) < execution_plan.max_revisions else "finalize"
            return "repair" if int(state.get("revision_count") or 0) < execution_plan.max_revisions else "finalize"

        builder.add_node("retrieve_categories", retrieve_categories)
        builder.add_node("build_payload", build_payload)
        builder.add_node("curriculum", curriculum)
        builder.add_node("build_tasks", build_tasks)
        builder.add_node("generate_questions", generate_questions)
        builder.add_node("aggregate", aggregate)
        builder.add_node("validate", validate)
        builder.add_node("review", review)
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
            {"repair": "repair", "review": "review", "finalize": "finalize"},
        )
        builder.add_conditional_edges(
            "review",
            after_review,
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


def _enum_key(value: Any) -> str:
    source = str(value or "").replace("Đ", "D").replace("đ", "d")
    ascii_value = unicodedata.normalize("NFKD", source).encode("ascii", "ignore").decode("ascii")
    return "_".join("".join(character if character.isalnum() else " " for character in ascii_value).upper().split())


def _normalize_generated_question(question: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(question)
    question_type_aliases = {
        "SINGLE": "SINGLE_CHOICE",
        "SINGLE_CHOICE": "SINGLE_CHOICE",
        "MOT_DAP_AN": "SINGLE_CHOICE",
        "MULTIPLE": "MULTIPLE_CHOICE",
        "MULTIPLE_CHOICE": "MULTIPLE_CHOICE",
        "NHIEU_DAP_AN": "MULTIPLE_CHOICE",
        "TRUE_FALSE": "TRUE_FALSE",
        "DUNG_SAI": "TRUE_FALSE",
        "FILL_BLANK": "FILL_BLANK",
        "FILL_IN_THE_BLANK": "FILL_BLANK",
        "DIEN_VAO_CHO_TRONG": "FILL_BLANK",
        "ESSAY": "ESSAY",
        "TU_LUAN": "ESSAY",
        "MATCHING": "MATCHING",
    }
    difficulty_aliases = {
        "EASY": "EASY", "BEGINNER": "EASY", "DE": "EASY", "CO_BAN": "EASY",
        "MEDIUM": "MEDIUM", "INTERMEDIATE": "MEDIUM", "TRUNG_BINH": "MEDIUM",
        "HARD": "HARD", "ADVANCED": "HARD", "KHO": "HARD", "NANG_CAO": "HARD",
    }
    if normalized.get("question_type"):
        raw = _enum_key(normalized["question_type"])
        normalized["question_type"] = question_type_aliases.get(raw, raw)
    if normalized.get("difficulty_level"):
        raw = _enum_key(normalized["difficulty_level"])
        normalized["difficulty_level"] = difficulty_aliases.get(raw, raw)
    normalized["options"] = [
        {
            **option,
            "option_text": str(option.get("option_text") or option.get("text") or "").strip(),
            "is_correct": option.get("is_correct") is True or str(option.get("is_correct")).lower() == "true",
        }
        for option in normalized.get("options") or []
        if isinstance(option, dict)
    ]
    return normalized
