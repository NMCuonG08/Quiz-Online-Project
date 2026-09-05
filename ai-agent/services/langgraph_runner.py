from __future__ import annotations

import asyncio
import time
import json
import logging
import re
from contextlib import AsyncExitStack
from typing import Annotated, Any, Awaitable, Callable, Literal, Optional
from langchain_core._api.deprecation import suppress_langchain_deprecation_warning

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
try:
    from langchain_anthropic import ChatAnthropic
except ImportError:  # pragma: no cover - optional provider
    ChatAnthropic = None  # type: ignore[assignment,misc]
from pydantic import BaseModel, Field
from .protocol import UIAction, UIBlock
from .intent_schema import (
    GENERAL_INTENTS,
    INTENT_DOMAINS,
    STRONG_PLANNER_INTENTS,
    InteractionPlan,
)
from .harness.context import ContextBuilder
from .model_router import ModelRoute, ModelRouter, TraceObserver
from .orchestration.registry import get_agent_spec
try:
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
except ImportError:  # pragma: no cover - optional in minimal local installs
    AsyncPostgresSaver = None  # type: ignore[assignment,misc]
with suppress_langchain_deprecation_warning():
    from langgraph.graph import END, START, MessagesState, StateGraph
    from langgraph.prebuilt import ToolNode, tools_condition
    from langgraph.types import Command


ToolDispatcher = Callable[[str, dict[str, Any]], Awaitable[str]]
ModelObserver = Callable[[str, str, float, dict[str, object]], None]
BeforeModelCall = Callable[[], None]

logger = logging.getLogger(__name__)

DifficultyLevel = Literal["EASY", "MEDIUM", "HARD"]
QuizType = Literal["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK", "ESSAY"]
QuestionType = Literal["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "ESSAY", "MATCHING"]
KnowledgeVisibility = Literal["PUBLIC", "PRIVATE"]
KnowledgeReviewStatus = Literal["PUBLISHED", "QUARANTINED"]
Limit10 = Annotated[int, Field(ge=1, le=10)]
Limit20 = Annotated[int, Field(ge=1, le=20)]
Limit50 = Annotated[int, Field(ge=1, le=50)]
Limit200 = Annotated[int, Field(ge=1, le=200)]
PositiveNumber = Annotated[float, Field(ge=1)]
NonNegativeNumber = Annotated[float, Field(ge=0)]
Percentage = Annotated[float, Field(ge=0, le=100)]
NonNegativeInteger = Annotated[int, Field(ge=0)]


class QuestionOptionInput(BaseModel):
    option_text: str = Field(min_length=1, description="Visible answer text")
    is_correct: bool
    sort_order: int = Field(ge=0)
    explanation: str = ""


class QuestionDraftInput(BaseModel):
    question_text: str = Field(min_length=1)
    question_type: QuestionType
    options: list[QuestionOptionInput]
    media_url: str = ""
    points: NonNegativeNumber = 1
    time_limit: NonNegativeNumber = 0
    explanation: str = ""
    difficulty_level: Optional[DifficultyLevel] = None
    sort_order: NonNegativeInteger = 0
    is_required: bool = True


class QuestionOrderInput(BaseModel):
    id: str = Field(min_length=1)
    sort_order: int = Field(ge=0)


class AgentGraphState(MessagesState):
    """Checkpointed state owned by the live agent graph."""

    run_id: str
    scope: str
    intent: str
    orchestration_mode: str


class LangGraphQuizRunner:
    """ReAct graph with an explicit ToolNode and a guarded post-tool edge."""

    def __init__(
        self,
        model: str,
        api_key: str,
        base_url: Optional[str],
        postgres_url: Optional[str] = None,
        *,
        planner_fast_model: Optional[str] = None,
        planner_fast_api_key: Optional[str] = None,
        planner_fast_base_url: Optional[str] = None,
        planner_strong_model: Optional[str] = None,
        planner_strong_api_key: Optional[str] = None,
        planner_strong_base_url: Optional[str] = None,
        executor_reasoning_effort: Optional[str] = None,
        planner_fast_reasoning_effort: Optional[str] = None,
        planner_strong_reasoning_effort: Optional[str] = None,
        executor_timeout_seconds: float = 60,
        planner_fast_timeout_seconds: float = 8,
        planner_strong_timeout_seconds: float = 25,
        model_max_retries: int = 1,
        use_responses_api: bool = False,
        planner_confidence_threshold: float = 0.82,
        planner_escalate_writes: bool = True,
        executor_provider: str = "openai",
        executor_fallback_model: Optional[str] = None,
        executor_fallback_provider: str = "openai",
        executor_fallback_api_key: Optional[str] = None,
        executor_fallback_base_url: Optional[str] = None,
        executor_attempt_timeout_seconds: float = 60.0,
        executor_fallback_timeout_seconds: float = 60.0,
        model_failure_threshold: int = 2,
        model_cooldown_seconds: float = 30.0,
    ) -> None:
        self.executor_provider = executor_provider
        self.llm = self._make_provider_client(
            executor_provider,
            model, api_key, base_url, 0.2, executor_reasoning_effort,
            executor_timeout_seconds, 0, use_responses_api,
        )
        executor_routes = [ModelRoute(
            name="primary",
            provider=executor_provider,
            model=model,
            client=self.llm,
            timeout_seconds=max(1.0, executor_attempt_timeout_seconds),
        )]
        fallback_key = executor_fallback_api_key or api_key
        fallback_base_url = executor_fallback_base_url or base_url
        has_distinct_fallback = (
            executor_fallback_provider != executor_provider
            or executor_fallback_model != model
            or fallback_base_url != base_url
        )
        if executor_fallback_model and fallback_key and has_distinct_fallback:
            fallback_client = self._make_provider_client(
                executor_fallback_provider,
                executor_fallback_model,
                fallback_key,
                fallback_base_url,
                0.2,
                executor_reasoning_effort,
                executor_timeout_seconds,
                0,
                use_responses_api,
            )
            executor_routes.append(ModelRoute(
                name="fallback",
                provider=executor_fallback_provider,
                model=executor_fallback_model,
                client=fallback_client,
                timeout_seconds=max(1.0, executor_fallback_timeout_seconds),
            ))
        self.executor_router = ModelRouter(
            executor_routes,
            failure_threshold=model_failure_threshold,
            cooldown_seconds=model_cooldown_seconds,
        )
        self.planner_fast = self._make_llm(
            planner_fast_model or model,
            planner_fast_api_key or api_key,
            planner_fast_base_url or base_url,
            0,
            planner_fast_reasoning_effort,
            planner_fast_timeout_seconds,
            0,
            use_responses_api,
        )
        self.planner_strong = self._make_llm(
            planner_strong_model or model,
            planner_strong_api_key or api_key,
            planner_strong_base_url or base_url,
            0,
            planner_strong_reasoning_effort,
            planner_strong_timeout_seconds,
            0,
            use_responses_api,
        )
        self.planner_confidence_threshold = max(0.0, min(planner_confidence_threshold, 1.0))
        self.planner_escalate_writes = planner_escalate_writes
        self.planner_fast_timeout_seconds = max(1.0, planner_fast_timeout_seconds)
        self.planner_strong_timeout_seconds = max(1.0, planner_strong_timeout_seconds)
        self.postgres_url = postgres_url
        self._checkpointer: Optional[Any] = None
        self._checkpointer_context: Optional[Any] = None
        self._checkpointer_stack = AsyncExitStack()
        self._checkpointer_ready = False

    @staticmethod
    def _make_llm(
        model: str,
        api_key: str,
        base_url: Optional[str],
        temperature: float,
        reasoning_effort: Optional[str],
        timeout_seconds: float,
        max_retries: int,
        use_responses_api: bool,
    ) -> ChatOpenAI:
        options: dict[str, Any] = {
            "model": model,
            "api_key": api_key,
            "base_url": base_url,
            "temperature": temperature,
            "request_timeout": max(1.0, timeout_seconds),
            "max_retries": max(0, max_retries),
            "use_responses_api": use_responses_api,
        }
        if reasoning_effort:
            options["reasoning_effort"] = reasoning_effort
        return ChatOpenAI(**options)

    @staticmethod
    def _make_provider_client(
        provider: str,
        model: str,
        api_key: str,
        base_url: Optional[str],
        temperature: float,
        reasoning_effort: Optional[str],
        timeout_seconds: float,
        max_retries: int,
        use_responses_api: bool,
    ) -> Any:
        normalized = (provider or "openai").strip().lower()
        if normalized in {"anthropic", "claude"}:
            if ChatAnthropic is None:
                raise RuntimeError(
                    "Anthropic provider requested but langchain-anthropic is not installed."
                )
            return ChatAnthropic(
                model=model,
                anthropic_api_key=api_key,
                temperature=temperature,
                timeout=max(1.0, timeout_seconds),
                max_retries=max(0, max_retries),
            )
        return LangGraphQuizRunner._make_llm(
            model, api_key, base_url, temperature, reasoning_effort,
            timeout_seconds, max_retries, use_responses_api,
        )

    async def _get_checkpointer(self) -> Optional[Any]:
        if not self.postgres_url or AsyncPostgresSaver is None:
            return None
        if self._checkpointer is None:
            self._checkpointer_context = AsyncPostgresSaver.from_conn_string(self.postgres_url)
            self._checkpointer = await self._checkpointer_stack.enter_async_context(
                self._checkpointer_context
            )
        if not self._checkpointer_ready:
            await self._checkpointer.setup()
            self._checkpointer_ready = True
        return self._checkpointer

    async def checkpointer_ready(self) -> bool:
        if not self.postgres_url:
            return False
        try:
            return await self._get_checkpointer() is not None
        except Exception:
            return False

    async def close(self) -> None:
        await self._checkpointer_stack.aclose()

    async def invoke_worker(
        self,
        role: str,
        system_prompt: str,
        payload: dict[str, Any],
        *,
        config: dict[str, Any],
        record_model: Optional[ModelObserver] = None,
        before_model_call: Optional[BeforeModelCall] = None,
        trace_observer: Optional[TraceObserver] = None,
    ) -> dict[str, Any]:
        """Run one isolated structured worker through the model router."""
        if before_model_call:
            before_model_call()
        worker_config = dict(config)
        metadata = dict(config.get("metadata") or {})
        metadata["agent_role"] = role
        worker_config["metadata"] = metadata
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=json.dumps(payload, ensure_ascii=False, default=str)),
        ]
        route_kind = get_agent_spec(role).model_route
        if route_kind == "planner_fast":
            route_label = f"worker:{role}:planner_fast"
            await ModelRouter._trace(trace_observer, "worker", "start", route_label)
            started = time.perf_counter()
            try:
                message = await asyncio.wait_for(
                    self.planner_fast.ainvoke(messages, config=worker_config),
                    timeout=self.planner_fast_timeout_seconds,
                )
                duration = time.perf_counter() - started
                if record_model:
                    record_model(self.planner_fast.model_name, "success", duration, getattr(message, "usage_metadata", None) or {})
                await ModelRouter._trace(trace_observer, "worker", "success", route_label)
            except Exception:
                duration = time.perf_counter() - started
                if record_model:
                    record_model(self.planner_fast.model_name, "error", duration, {})
                await ModelRouter._trace(trace_observer, "worker", "error", route_label)
                raise
        else:
            message, _ = await self.executor_router.ainvoke(
                messages,
                config=worker_config,
                operation=f"worker_{role}",
                record_model=record_model,
                trace_observer=trace_observer,
            )
        result = self._extract_json_object(message, role)
        if result is None:
            raise ValueError(f"WORKER_OUTPUT_INVALID: {role} không trả JSON object hợp lệ.")
        return result

    async def invoke(
        self,
        system_prompt: str,
        history: list[dict[str, str]],
        user_input: str,
        allowed_tools: set[str],
        dispatch: ToolDispatcher,
        should_stop_after_tools: Callable[[], bool],
        config: dict[str, Any],
        interaction_intent: str,
        record_model: Optional[ModelObserver] = None,
        interaction_plan: Optional[dict[str, Any]] = None,
        before_model_call: Optional[BeforeModelCall] = None,
        context_builder: Optional[ContextBuilder] = None,
        page_context: Optional[dict[str, Any]] = None,
        memory: Optional[list[Any]] = None,
        evidence: Optional[list[Any]] = None,
        agent_first: bool = False,
        trace_observer: Optional[TraceObserver] = None,
    ) -> AIMessage:
        # Keep the primary route replaceable for tests and controlled runtime
        # overrides without rebuilding the whole runner.
        primary_route = self.executor_router.routes[0]
        if primary_route.client is not self.llm:
            self.executor_router.routes[0] = ModelRoute(
                name=primary_route.name,
                provider=self.executor_provider,
                model=getattr(self.llm, "model_name", primary_route.model),
                client=self.llm,
                timeout_seconds=primary_route.timeout_seconds,
            )
        tools = self._build_tools(allowed_tools, dispatch)

        async def assistant(state: AgentGraphState) -> dict[str, list[AIMessage]]:
            try:
                if before_model_call:
                    before_model_call()
                message, _ = await self.executor_router.ainvoke(
                    state["messages"],
                    config=config,
                    operation="executor",
                    tools=tools,
                    bind_kwargs={
                        "parallel_tool_calls": False,
                    } if agent_first else {},
                    record_model=record_model,
                    trace_observer=trace_observer,
                )
            except Exception:
                raise
            return {"messages": [message]}

        async def general_response(state: AgentGraphState) -> dict[str, list[AIMessage]]:
            """Fast path: general chat never receives tool schemas or ToolNode."""
            try:
                if before_model_call:
                    before_model_call()
                message, _ = await self.executor_router.ainvoke(
                    state["messages"],
                    config=config,
                    operation="executor_general",
                    record_model=record_model,
                    trace_observer=trace_observer,
                )
            except Exception:
                raise
            return {"messages": [message]}

        async def router(_state: AgentGraphState) -> Command[Literal["general_response", "assistant"]]:
            """Explicit handoff keeps the intent boundary visible in graph traces."""
            target = "general_response" if interaction_intent in GENERAL_INTENTS else "assistant"
            return Command(goto=target)

        graph = StateGraph(AgentGraphState)
        graph.add_node("assistant", assistant)
        graph.add_node("tools", ToolNode(tools, handle_tool_errors=True))
        if agent_first:
            # The model decides whether to answer or use a tool in one loop.
            # Auth, scope and tool policy remain deterministic in dispatch().
            graph.add_edge(START, "assistant")
        else:
            graph.add_node("router", router)
            graph.add_node("general_response", general_response)
            graph.add_edge(START, "router")
            graph.add_edge("general_response", END)
        graph.add_conditional_edges(
            "assistant",
            tools_condition,
            {"tools": "tools", END: END},
        )
        graph.add_conditional_edges(
            "tools",
            lambda _state: END if should_stop_after_tools() else "assistant",
            {END: END, "assistant": "assistant"},
        )
        compiled = graph.compile(checkpointer=await self._get_checkpointer())
        context_snapshot = (context_builder or ContextBuilder()).build(
            system_prompt=system_prompt,
            history=history,
            user_message=user_input,
            interaction_plan=interaction_plan,
            page_context=page_context,
            memory=memory,
            evidence=evidence,
        )
        messages: list[BaseMessage] = [
            SystemMessage(content=context_snapshot.system_message())
        ]
        for message in context_snapshot.history:
            if message["role"] == "user":
                messages.append(HumanMessage(content=message["content"]))
            elif message["role"] == "assistant":
                messages.append(AIMessage(content=message["content"]))
        messages.append(HumanMessage(content=context_snapshot.user_message))
        metadata = config.get("metadata") if isinstance(config.get("metadata"), dict) else {}
        result = await compiled.ainvoke({
            "messages": messages,
            "run_id": str(metadata.get("local_trace_id") or "unknown"),
            "scope": str(metadata.get("scope") or "learner"),
            "intent": interaction_intent,
            "orchestration_mode": "agent_first" if agent_first else "planner_legacy",
        }, config=config)
        last = result["messages"][-1]
        return last if isinstance(last, AIMessage) else AIMessage(content="")

    async def plan(
        self,
        user_input: str,
        route: str,
        scope: str,
        config: dict[str, Any],
        history: Optional[list[dict[str, str]]] = None,
        record_model: Optional[ModelObserver] = None,
        before_model_call: Optional[BeforeModelCall] = None,
    ) -> dict[str, Any]:
        context_payload = {
            "route": route,
            "scope": scope,
            "recent_history": (history or [])[-6:],
            "current_user_message": user_input,
        }
        taxonomy_lines = [
            f"- {domain}: " + ", ".join(sorted(intents))
            for domain, intents in INTENT_DOMAINS.items()
        ]
        base_prompt = """You are the semantic intent planner for Quiz Online.
Understand the user's goal from meaning, recent conversation, page context and account scope. Do not classify by literal keyword matching.

Critical distinction:
- Wanting to take/do/find/get a quiz, asking for a recommendation, or saying 'I want to do a quiz about IT, recommend one' is quiz_recommend or quiz_search.
- Authoring a new quiz for other users is quiz_create only when the user clearly asks to create/generate/compose a new quiz.
- quiz_search means the user asks to find/show/list quizzes matching an explicit query or topic. Example: 'Tìm quiz Python cơ bản cho người mới' → quiz_search.
- quiz_recommend means the user asks the assistant to rank, choose, suggest, personalize, or tell them which quiz is best. Example: 'Bạn recommend quiz Python nào cho tôi?' → quiz_recommend.

Intent families cover conversation/help; quiz search/recommend/detail/create/update/delete/publish/unpublish/start/resume/result/history/owned/attempts/in-progress; question list/create/update/delete/duplicate/reorder; category list/recommend/create/update/delete; knowledge search/import/list/submit-review/review; image search; account identity/permissions; admin dashboard/audit; temporal/auth/no-evidence/unsupported.

Personal-data distinctions:
- "lịch sử làm quiz" means completed learning history → quiz_history.
- "các lần làm/attempt của tôi" means all attempts → quiz_attempts.
- "quiz đang làm dở" means resumable attempts → quiz_in_progress or quiz_resume.
- "quiz tôi đã tạo / quiz của tôi" means owned authoring data → quiz_owned, never quiz_search.
- "có category nào, chọn một category phù hợp" means category_recommend when the user asks the agent to choose; category_list only lists them.

Classify two independent axes:
- intent is the leaf business task.
- dialogue_act is request, correction, continuation, confirmation, rejection, selection, clarification_answer, cancel, or help.
Set refers_to_previous_turn and reference_mode when the message depends on recent history. Corrections such as "à", "ý tôi là", or "không phải" replace the previous interpretation; never search their whole sentence as a keyword. Set selection_strategy for choice requests.

Return plan_interaction exactly once. Extract entities and secondary intents. For quiz authoring, extract the exact question_count, content_language, time_limit and time_limit_unit when stated. time_limit_unit must be `minutes` or `seconds`; do not discard the unit. Use content_language='auto' when the output language is not explicit. Set confidence honestly. If more context is required, set needs_clarification and provide one concise clarification question. Risk describes the requested effect, not the user's claimed role. Never infer authorization from the message."""
        base_prompt += "\n\nLeaf intent taxonomy:\n" + "\n".join(taxonomy_lines)
        base_prompt += (
            "\nOnly use secondary_intents for an independently requested second goal. "
            "Do not add conversation_general for politeness and do not add quiz_search merely "
            "because search is an implementation step of quiz_recommend."
        )

        fast_plan: Optional[InteractionPlan] = None
        try:
            fast_plan = await self._plan_once(
                self.planner_fast,
                base_prompt,
                context_payload,
                config,
                record_model,
                "fast",
                before_model_call,
            )
        except Exception:
            fast_plan = None

        escalate = fast_plan is None or self._should_escalate(fast_plan)
        if escalate:
            strong_prompt = base_prompt + (
                "\n\nAct as the strong verifier. Independently inspect the user context and correct "
                "the fast planner when necessary. Fast plan candidate:\n"
                + (fast_plan.model_dump_json() if fast_plan else "unavailable")
            )
            try:
                strong_plan = await self._plan_once(
                    self.planner_strong,
                    strong_prompt,
                    context_payload,
                    config,
                    record_model,
                    "strong",
                    before_model_call,
                )
                return strong_plan.model_dump()
            except Exception as exc:
                logger.warning(
                    "%s planner failed; using fast plan when available error=%s",
                    "strong", type(exc).__name__,
                )
                if fast_plan is None:
                    return self._fallback_plan()
        return (fast_plan or InteractionPlan(
            intent="unsupported", confidence=0, ambiguity="high",
            needs_clarification=True, clarification_question="Bạn muốn tìm, làm hay tạo một quiz?",
            risk="none", route="clarify",
        )).model_dump()

    def _should_escalate(self, plan: InteractionPlan) -> bool:
        return (
            plan.confidence < self.planner_confidence_threshold
            or plan.ambiguity == "high"
            or plan.needs_clarification
            or bool(plan.secondary_intents)
            or (
                self.planner_escalate_writes
                and (
                    plan.intent in STRONG_PLANNER_INTENTS
                    or plan.risk in {"write", "destructive", "admin"}
                )
            )
        )

    async def _plan_once(
        self,
        llm: ChatOpenAI,
        system_prompt: str,
        context_payload: dict[str, Any],
        config: dict[str, Any],
        record_model: Optional[ModelObserver],
        tier: str,
        before_model_call: Optional[BeforeModelCall] = None,
    ) -> InteractionPlan:
        @tool("plan_interaction", args_schema=InteractionPlan)
        async def plan_interaction(**kwargs: Any) -> str:
            """Return one validated semantic interaction plan."""
            return json.dumps(kwargs, ensure_ascii=False)

        # The planner exposes exactly one tool. `required` is more portable
        # than naming the tool explicitly across strong/reasoning providers.
        planner = llm.bind_tools([plan_interaction], tool_choice="required")
        started = time.perf_counter()
        try:
            if before_model_call:
                before_model_call()
            message = await planner.ainvoke(
                [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=json.dumps(context_payload, ensure_ascii=False)),
                ],
                config={**config, "run_name": f"quiz_ai_planner_{tier}"},
            )
        except Exception:
            if record_model:
                record_model(llm.model_name, "error", time.perf_counter() - started, {})
            raise
        if record_model:
            record_model(llm.model_name, "success", time.perf_counter() - started, message.usage_metadata or {})
        plan = self._extract_plan(message)
        if plan is not None:
            return plan

        # Do not spend a second full provider timeout here. The caller may
        # already have a valid fast plan, and the outer planner will safely
        # fall back to it. JSON extraction above also covers providers that
        # ignored the tool constraint without doubling latency.
        logger.warning("%s planner returned no plan_interaction", tier)
        raise RuntimeError(f"{tier} planner did not return plan_interaction")

    @staticmethod
    def _extract_plan(message: AIMessage) -> Optional[InteractionPlan]:
        """Accept normal tool calls plus provider-compatible JSON fallbacks."""
        calls = list(message.tool_calls or [])
        for call in calls:
            if call.get("name") == "plan_interaction":
                try:
                    return InteractionPlan.model_validate(call.get("args") or {})
                except Exception:
                    continue

        # A few compatible providers expose raw tool calls only through the
        # additional kwargs envelope.
        for raw_call in (message.additional_kwargs or {}).get("tool_calls", []):
            function = raw_call.get("function") if isinstance(raw_call, dict) else None
            if not isinstance(function, dict) or function.get("name") != "plan_interaction":
                continue
            try:
                arguments = function.get("arguments") or "{}"
                return InteractionPlan.model_validate(
                    json.loads(arguments) if isinstance(arguments, str) else arguments
                )
            except Exception:
                continue

        content = message.content
        if isinstance(content, list):
            content = "\n".join(
                str(item.get("text") or item.get("content") or "")
                for item in content
                if isinstance(item, dict)
            )
        if not isinstance(content, str) or not content.strip():
            return None
        candidates = [content.strip()]
        unfenced = re.sub(r"^```(?:json)?\s*|\s*```$", "", content.strip(), flags=re.IGNORECASE)
        if unfenced != content.strip():
            candidates.append(unfenced)
        match = re.search(r"\{.*\}", content, flags=re.DOTALL)
        if match:
            candidates.append(match.group(0))
        for candidate in candidates:
            try:
                return InteractionPlan.model_validate(json.loads(candidate))
            except Exception:
                continue
        return None

    @staticmethod
    def _extract_json_object(
        message: AIMessage,
        role: str = "",
    ) -> Optional[dict[str, Any]]:
        """Normalize text, structured content, tool-call and array outputs."""
        def normalize(value: Any) -> Optional[dict[str, Any]]:
            if isinstance(value, dict):
                nested = value.get("payload") or value.get("result")
                if isinstance(nested, dict):
                    return nested
                return value
            if isinstance(value, list):
                if role == "curriculum":
                    return {"blueprint": value}
                if role in {"quiz_builder", "quality_reviewer"}:
                    return {"questions": value} if role == "quiz_builder" else {"findings": value}
            return None

        for call in list(message.tool_calls or []):
            result = normalize(call.get("args") if isinstance(call, dict) else None)
            if result is not None:
                return result
        for raw_call in (message.additional_kwargs or {}).get("tool_calls", []):
            function = raw_call.get("function") if isinstance(raw_call, dict) else None
            if not isinstance(function, dict):
                continue
            arguments = function.get("arguments") or "{}"
            try:
                result = normalize(json.loads(arguments) if isinstance(arguments, str) else arguments)
            except (TypeError, ValueError, json.JSONDecodeError):
                result = None
            if result is not None:
                return result

        content = message.content
        if isinstance(content, list):
            content = "\n".join(
                str(
                    item.get("text")
                    or item.get("content")
                    or item.get("output_text")
                    or ""
                )
                for item in content
                if isinstance(item, dict)
            )
        if not isinstance(content, str) or not content.strip():
            content = str(
                (message.additional_kwargs or {}).get("output_text")
                or (message.additional_kwargs or {}).get("content")
                or ""
            )
        if not content.strip():
            return None
        raw = content.strip()
        candidates = [raw]
        unfenced = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.IGNORECASE)
        if unfenced != raw:
            candidates.append(unfenced)
        for pattern in (r"\{.*\}", r"\[.*\]"):
            match = re.search(pattern, raw, flags=re.DOTALL)
            if match:
                candidates.append(match.group(0))
        for candidate in candidates:
            try:
                result = normalize(json.loads(candidate))
            except (TypeError, ValueError, json.JSONDecodeError):
                continue
            if result is not None:
                return result
        return None

    @staticmethod
    def _fallback_plan() -> dict[str, Any]:
        return InteractionPlan(
            intent="unsupported",
            confidence=0,
            ambiguity="high",
            needs_clarification=True,
            clarification_question="Mình chưa xác định chắc mục tiêu của bạn. Bạn muốn tìm, làm hay tạo một quiz?",
            risk="none",
            route="clarify",
        ).model_dump()

    @staticmethod
    def _build_tools(allowed: set[str], dispatch: ToolDispatcher) -> list[Any]:
        tools: list[Any] = []

        def include(name: str) -> bool:
            return name in allowed

        if include("plan_interaction"):
            @tool("plan_interaction", args_schema=InteractionPlan)
            async def plan_interaction(**kwargs: Any) -> str:
                """Request a server-owned interaction policy from a semantic plan."""
                return await dispatch("plan_interaction", kwargs)
            tools.append(plan_interaction)

        if include("get_current_time"):
            @tool
            async def get_current_time() -> str:
                """Get trusted current server date/time for temporal questions."""
                return await dispatch("get_current_time", {})
            tools.append(get_current_time)

        if include("get_current_user"):
            @tool
            async def get_current_user() -> str:
                """Get verified current account identity and roles."""
                return await dispatch("get_current_user", {})
            tools.append(get_current_user)

        if include("get_my_permissions"):
            @tool
            async def get_my_permissions() -> str:
                """Get verified effective permissions for the current account."""
                return await dispatch("get_my_permissions", {})
            tools.append(get_my_permissions)

        if include("search_quizzes"):
            @tool
            async def search_quizzes(query: str, limit: Limit20 = 10) -> str:
                """Search real quizzes in the application database."""
                return await dispatch("search_quizzes", {"query": query, "limit": limit})
            tools.append(search_quizzes)

        if include("recommend_quizzes"):
            @tool
            async def recommend_quizzes(limit: Limit20 = 10, query: str = "") -> str:
                """Recommend topic-matched quizzes first, then clearly labeled popular fallback results."""
                return await dispatch("recommend_quizzes", {"limit": limit, "query": query})
            tools.append(recommend_quizzes)

        if include("get_quiz"):
            @tool
            async def get_quiz(quiz_id: str = "", slug: str = "") -> str:
                """Get one real quiz by id or slug."""
                return await dispatch("get_quiz", {"quiz_id": quiz_id, "slug": slug})
            tools.append(get_quiz)

        if include("search_knowledge"):
            @tool
            async def search_knowledge(query: str, limit: Limit10 = 5) -> str:
                """Search published public knowledge before web search."""
                return await dispatch("search_knowledge", {"query": query, "limit": limit})
            tools.append(search_knowledge)

        if include("list_categories"):
            @tool
            async def list_categories() -> str:
                """List real quiz categories and ids."""
                return await dispatch("list_categories", {})
            tools.append(list_categories)

        if include("create_category"):
            @tool
            async def create_category(
                name: str, description: str, slug: str, is_active: bool,
                parent_id: str = "", icon_url: str = "",
            ) -> str:
                """Admin only: propose creating a category; execution requires Accept."""
                return await dispatch("create_category", {
                    "name": name, "description": description, "slug": slug,
                    "is_active": is_active, "parent_id": parent_id,
                    "icon_url": icon_url,
                })
            tools.append(create_category)

        if include("update_category"):
            @tool
            async def update_category(
                category_id: str, name: Optional[str] = None, description: Optional[str] = None,
                slug: Optional[str] = None, is_active: Optional[bool] = None,
                parent_id: Optional[str] = None,
            ) -> str:
                """Admin only: propose updating a category; execution requires Accept."""
                return await dispatch("update_category", {
                    "category_id": category_id, "name": name,
                    "description": description, "slug": slug,
                    "is_active": is_active, "parent_id": parent_id,
                })
            tools.append(update_category)

        if include("delete_category"):
            @tool
            async def delete_category(category_id: str) -> str:
                """Admin only: propose deleting a category; execution requires Accept."""
                return await dispatch("delete_category", {"category_id": category_id})
            tools.append(delete_category)

        if include("get_my_quizzes"):
            @tool
            async def get_my_quizzes(limit: Limit20 = 10) -> str:
                """Get quizzes owned by the signed-in user."""
                return await dispatch("get_my_quizzes", {"limit": limit})
            tools.append(get_my_quizzes)

        if include("get_quiz_history"):
            @tool
            async def get_quiz_history(limit: Limit50 = 10) -> str:
                """Get completed quiz attempts for the signed-in user."""
                return await dispatch("get_quiz_history", {"limit": limit})
            tools.append(get_quiz_history)

        if include("get_in_progress_quizzes"):
            @tool
            async def get_in_progress_quizzes() -> str:
                """Get the user's quiz attempts that can be resumed."""
                return await dispatch("get_in_progress_quizzes", {})
            tools.append(get_in_progress_quizzes)

        if include("get_all_attempts"):
            @tool
            async def get_all_attempts(limit: Limit50 = 20) -> str:
                """Get all learner attempts and progress."""
                return await dispatch("get_all_attempts", {"limit": limit})
            tools.append(get_all_attempts)

        if include("get_quiz_result"):
            @tool
            async def get_quiz_result(session_id: str) -> str:
                """Get the signed-in user's result for one quiz session."""
                return await dispatch("get_quiz_result", {"session_id": session_id})
            tools.append(get_quiz_result)

        if include("list_questions"):
            @tool
            async def list_questions(quiz_id: str) -> str:
                """List questions in an owned quiz."""
                return await dispatch("list_questions", {"quiz_id": quiz_id})
            tools.append(list_questions)

        if include("get_quiz_build_status"):
            @tool
            async def get_quiz_build_status(quiz_id: str) -> str:
                """Inspect an owned quiz draft and report whether it is ready to publish."""
                return await dispatch("get_quiz_build_status", {"quiz_id": quiz_id})
            tools.append(get_quiz_build_status)

        if include("web_search"):
            @tool
            async def web_search(query: str, limit: Limit10 = 5) -> str:
                """Search web only after internal sources are insufficient."""
                return await dispatch("web_search", {"query": query, "limit": limit})
            tools.append(web_search)

        if include("search_images"):
            @tool
            async def search_images(query: str, limit: Limit10 = 8) -> str:
                """Retrieve public image URLs; do not generate or upload images."""
                return await dispatch("search_images", {"query": query, "limit": limit})
            tools.append(search_images)

        if include("list_knowledge_sources"):
            @tool
            async def list_knowledge_sources() -> str:
                """List creator or admin knowledge sources and review status."""
                return await dispatch("list_knowledge_sources", {})
            tools.append(list_knowledge_sources)

        if include("get_admin_dashboard_stats"):
            @tool
            async def get_admin_dashboard_stats() -> str:
                """Admin only: get platform dashboard statistics."""
                return await dispatch("get_admin_dashboard_stats", {})
            tools.append(get_admin_dashboard_stats)

        if include("list_audit_events"):
            @tool
            async def list_audit_events(
                limit: Limit200 = 50, action: str = "", resource_type: str = "",
            ) -> str:
                """Admin only: list recent audit events without secrets."""
                return await dispatch("list_audit_events", {
                    "limit": limit, "action": action, "resource_type": resource_type,
                })
            tools.append(list_audit_events)

        if include("create_quiz"):
            @tool
            async def create_quiz(
                title: str, slug: str, category_id: str, difficulty_level: DifficultyLevel,
                time_limit: PositiveNumber, quiz_type: QuizType, description: str = "",
                max_attempts: NonNegativeNumber = 0, passing_score: Percentage = 0,
                is_active: bool = False, instructions: str = "", thumbnail_url: str = "",
            ) -> str:
                """Propose creating a quiz; execution still requires Accept."""
                return await dispatch("create_quiz", {
                    "title": title, "slug": slug, "category_id": category_id,
                    "difficulty_level": difficulty_level, "time_limit": time_limit,
                    "quiz_type": quiz_type, "description": description,
                    "max_attempts": max_attempts, "passing_score": passing_score,
                    "is_active": is_active, "instructions": instructions,
                    "thumbnail_url": thumbnail_url,
                })
            tools.append(create_quiz)

        if include("create_quiz_with_questions"):
            @tool
            async def create_quiz_with_questions(
                title: str, slug: str, category_id: str, difficulty_level: DifficultyLevel,
                time_limit: PositiveNumber, quiz_type: QuizType,
                questions: Annotated[list[QuestionDraftInput], Field(min_length=1)],
                description: str = "", max_attempts: NonNegativeNumber = 0,
                passing_score: Percentage = 0, instructions: str = "", thumbnail_url: str = "",
            ) -> str:
                """Propose one inactive quiz draft plus all questions/options; preserve the user's language and Unicode diacritics, and execution requires Accept."""
                return await dispatch("create_quiz_with_questions", {
                    "title": title, "slug": slug, "category_id": category_id,
                    "difficulty_level": difficulty_level, "time_limit": time_limit,
                    "quiz_type": quiz_type,
                    "questions": [question.model_dump(exclude_none=True) for question in questions],
                    "description": description, "max_attempts": max_attempts,
                    "passing_score": passing_score, "instructions": instructions,
                    "thumbnail_url": thumbnail_url,
                })
            tools.append(create_quiz_with_questions)

        if include("update_quiz"):
            @tool
            async def update_quiz(
                quiz_id: str, title: Optional[str] = None, slug: Optional[str] = None,
                category_id: Optional[str] = None, description: Optional[str] = None,
                difficulty_level: Optional[DifficultyLevel] = None, time_limit: Optional[PositiveNumber] = None,
                max_attempts: Optional[NonNegativeNumber] = None, passing_score: Optional[Percentage] = None,
                is_active: Optional[bool] = None, quiz_type: Optional[QuizType] = None,
                instructions: Optional[str] = None,
            ) -> str:
                """Propose updating an owned quiz; execution still requires Accept."""
                return await dispatch("update_quiz", {
                    "quiz_id": quiz_id, "title": title, "slug": slug,
                    "category_id": category_id, "description": description,
                    "difficulty_level": difficulty_level, "time_limit": time_limit,
                    "max_attempts": max_attempts, "passing_score": passing_score,
                    "is_active": is_active, "quiz_type": quiz_type, "instructions": instructions,
                })
            tools.append(update_quiz)

        if include("delete_quiz"):
            @tool
            async def delete_quiz(quiz_id: str, confirmed: bool) -> str:
                """Propose deleting an owned quiz after explicit confirmation."""
                return await dispatch("delete_quiz", {"quiz_id": quiz_id, "confirmed": confirmed})
            tools.append(delete_quiz)

        if include("publish_quiz"):
            @tool
            async def publish_quiz(quiz_id: str) -> str:
                """Propose publishing an owned quiz; execution requires Accept."""
                return await dispatch("publish_quiz", {"quiz_id": quiz_id})
            tools.append(publish_quiz)

        if include("unpublish_quiz"):
            @tool
            async def unpublish_quiz(quiz_id: str) -> str:
                """Propose unpublishing an owned quiz; execution requires Accept."""
                return await dispatch("unpublish_quiz", {"quiz_id": quiz_id})
            tools.append(unpublish_quiz)

        if include("start_quiz"):
            @tool
            async def start_quiz(quiz_id: str = "", quiz_slug: str = "") -> str:
                """Propose starting or resuming a quiz attempt; execution requires Accept."""
                return await dispatch("start_quiz", {"quiz_id": quiz_id, "quiz_slug": quiz_slug})
            tools.append(start_quiz)

        if include("create_question"):
            @tool
            async def create_question(
                quiz_id: str, question_text: str, question_type: QuestionType,
                options: list[QuestionOptionInput], points: NonNegativeNumber = 1,
                time_limit: NonNegativeNumber = 0, explanation: str = "",
                difficulty_level: Optional[DifficultyLevel] = None, sort_order: NonNegativeInteger = 0,
                is_required: bool = True, slug: str = "", media_url: str = "",
            ) -> str:
                """Propose creating a question; preserve the user's language and Unicode diacritics, and execution still requires Accept."""
                return await dispatch("create_question", {
                    "quiz_id": quiz_id, "question_text": question_text,
                    "question_type": question_type,
                    "options": [option.model_dump() for option in options], "points": points,
                    "time_limit": time_limit, "explanation": explanation,
                    "difficulty_level": difficulty_level, "sort_order": sort_order,
                    "is_required": is_required, "slug": slug, "media_url": media_url,
                })
            tools.append(create_question)

        if include("update_question"):
            @tool
            async def update_question(
                question_id: str, question_text: Optional[str] = None,
                question_type: Optional[QuestionType] = None, points: Optional[NonNegativeNumber] = None,
                time_limit: Optional[NonNegativeNumber] = None, explanation: Optional[str] = None,
                difficulty_level: Optional[DifficultyLevel] = None, sort_order: Optional[NonNegativeInteger] = None,
                is_required: Optional[bool] = None,
                options: Optional[list[QuestionOptionInput]] = None, slug: Optional[str] = None,
            ) -> str:
                """Propose updating a question; execution still requires Accept."""
                return await dispatch("update_question", {
                    "question_id": question_id, "question_text": question_text,
                    "question_type": question_type, "points": points,
                    "time_limit": time_limit, "explanation": explanation,
                    "difficulty_level": difficulty_level, "sort_order": sort_order,
                    "is_required": is_required, "slug": slug,
                    "options": [option.model_dump() for option in options] if options is not None else None,
                })
            tools.append(update_question)

        if include("delete_question"):
            @tool
            async def delete_question(question_id: str, confirmed: bool) -> str:
                """Propose deleting a question after explicit confirmation."""
                return await dispatch("delete_question", {
                    "question_id": question_id, "confirmed": confirmed,
                })
            tools.append(delete_question)

        if include("duplicate_question"):
            @tool
            async def duplicate_question(question_id: str, new_quiz_id: str = "") -> str:
                """Propose duplicating a question; execution requires Accept."""
                return await dispatch("duplicate_question", {
                    "question_id": question_id, "new_quiz_id": new_quiz_id,
                })
            tools.append(duplicate_question)

        if include("reorder_questions"):
            @tool
            async def reorder_questions(
                quiz_id: str, question_orders: list[QuestionOrderInput],
            ) -> str:
                """Propose reordering questions in an owned quiz; execution requires Accept."""
                return await dispatch("reorder_questions", {
                    "quiz_id": quiz_id,
                    "question_orders": [item.model_dump() for item in question_orders],
                })
            tools.append(reorder_questions)

        if include("import_knowledge_url"):
            @tool
            async def import_knowledge_url(
                url: str, title: str = "", visibility: KnowledgeVisibility = "PRIVATE",
            ) -> str:
                """Propose importing a safe URL as a DRAFT knowledge source; execution requires Accept."""
                return await dispatch("import_knowledge_url", {
                    "url": url, "title": title, "visibility": visibility,
                })
            tools.append(import_knowledge_url)

        if include("submit_knowledge_review"):
            @tool
            async def submit_knowledge_review(source_id: str) -> str:
                """Propose submitting a knowledge source for review; execution requires Accept."""
                return await dispatch("submit_knowledge_review", {"source_id": source_id})
            tools.append(submit_knowledge_review)

        if include("review_knowledge"):
            @tool
            async def review_knowledge(
                source_id: str, status: KnowledgeReviewStatus, rejection_reason: str = "",
            ) -> str:
                """Admin only: propose publishing or quarantining a source; execution requires Accept."""
                return await dispatch("review_knowledge", {
                    "source_id": source_id, "status": status,
                    "rejection_reason": rejection_reason,
                })
            tools.append(review_knowledge)

        if include("render_ui"):
            @tool
            async def render_ui(
                title: str = "", description: str = "",
                blocks: Optional[list[UIBlock]] = None, actions: Optional[list[UIAction]] = None,
            ) -> str:
                """Render generic UI only when no server-owned interaction policy applies."""
                return await dispatch("render_ui", {
                    "title": title, "description": description,
                    "blocks": [block.model_dump(exclude_none=True) for block in (blocks or [])],
                    "actions": [action.model_dump(exclude_none=True) for action in (actions or [])],
                })
            tools.append(render_ui)

        return tools
