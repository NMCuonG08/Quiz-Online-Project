from __future__ import annotations

from typing import Any, Awaitable, Callable, Literal, Optional
from langchain_core._api.deprecation import suppress_langchain_deprecation_warning

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
with suppress_langchain_deprecation_warning():
    from langgraph.graph import END, START, MessagesState, StateGraph
    from langgraph.prebuilt import ToolNode, tools_condition
    from langgraph.types import Command


ToolDispatcher = Callable[[str, dict[str, Any]], Awaitable[str]]


class LangGraphQuizRunner:
    """ReAct graph with an explicit ToolNode and a guarded post-tool edge."""

    def __init__(
        self,
        model: str,
        api_key: str,
        base_url: Optional[str],
    ) -> None:
        self.llm = ChatOpenAI(
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=0.2,
        )

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
    ) -> AIMessage:
        tools = self._build_tools(allowed_tools, dispatch)
        model = self.llm.bind_tools(tools)

        async def assistant(state: MessagesState) -> dict[str, list[AIMessage]]:
            return {"messages": [await model.ainvoke(state["messages"], config=config)]}

        async def general_response(state: MessagesState) -> dict[str, list[AIMessage]]:
            """Fast path: general chat never receives tool schemas or ToolNode."""
            return {"messages": [await self.llm.ainvoke(state["messages"], config=config)]}

        async def router(_state: MessagesState) -> Command[Literal["general_response", "assistant"]]:
            """Explicit handoff keeps the intent boundary visible in graph traces."""
            target = "general_response" if interaction_intent == "general" else "assistant"
            return Command(goto=target)

        graph = StateGraph(MessagesState)
        graph.add_node("router", router)
        graph.add_node("assistant", assistant)
        graph.add_node("general_response", general_response)
        graph.add_node("tools", ToolNode(tools, handle_tool_errors=True))
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
        compiled = graph.compile()
        messages: list[BaseMessage] = [SystemMessage(content=system_prompt)]
        for message in history:
            if message["role"] == "user":
                messages.append(HumanMessage(content=message["content"]))
            elif message["role"] == "assistant":
                messages.append(AIMessage(content=message["content"]))
        messages.append(HumanMessage(content=user_input))
        result = await compiled.ainvoke({"messages": messages}, config=config)
        last = result["messages"][-1]
        return last if isinstance(last, AIMessage) else AIMessage(content="")

    async def plan(
        self,
        user_input: str,
        route: str,
        scope: str,
        config: dict[str, Any],
    ) -> dict[str, Any]:
        @tool("plan_interaction")
        async def plan_interaction(intent: str, missing_fields: list[str] = []) -> str:
            """Classify the interaction as quiz_create, quiz_discovery, quiz_delete,
            learning_history, knowledge_import, auth_required, no_evidence, temporal,
            account_data, app_data, creator_data, admin_data, or general."""
            return "Server policy will resolve this plan."

        planner = self.llm.bind_tools([plan_interaction], tool_choice="plan_interaction")
        message = await planner.ainvoke(
            [
                SystemMessage(content=(
                    "Classify the user's interaction. Always call plan_interaction exactly once. "
                    "Use temporal for questions about today, the current time, date, year, or relative dates. "
                    "Use creator_data for owned quizzes/questions, editing, publishing, or creator analytics. "
                    "Use account_data for identity, permissions, personal history, or progress. "
                    "Use admin_data for platform administration. Use app_data for any other live application/database lookup. "
                    "Use general ONLY for greetings, thanks, or casual conversation that requires no tool or application/account data. "
                    "When uncertain, choose app_data instead of general. Do not answer the user."
                )),
                HumanMessage(content=f"route={route}; scope={scope}; user={user_input}"),
            ],
            config=config,
        )
        calls = message.tool_calls or []
        if not calls:
            return {"intent": "app_data", "missing_fields": []}
        args = calls[0].get("args") or {}
        return {
            "intent": str(args.get("intent") or "app_data"),
            "missing_fields": [str(item) for item in args.get("missing_fields", [])],
        }

    @staticmethod
    def _build_tools(allowed: set[str], dispatch: ToolDispatcher) -> list[Any]:
        tools: list[Any] = []

        def include(name: str) -> bool:
            return name in allowed

        if include("plan_interaction"):
            @tool
            async def plan_interaction(intent: str, missing_fields: list[str] = []) -> str:
                """Request a server-owned special interaction template."""
                return await dispatch("plan_interaction", {"intent": intent, "missing_fields": missing_fields})
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
            async def search_quizzes(query: str, limit: int = 10) -> str:
                """Search real quizzes in the application database."""
                return await dispatch("search_quizzes", {"query": query, "limit": limit})
            tools.append(search_quizzes)

        if include("recommend_quizzes"):
            @tool
            async def recommend_quizzes(limit: int = 10) -> str:
                """Recommend popular quizzes from real application data."""
                return await dispatch("recommend_quizzes", {"limit": limit})
            tools.append(recommend_quizzes)

        if include("get_quiz"):
            @tool
            async def get_quiz(quiz_id: str = "", slug: str = "") -> str:
                """Get one real quiz by id or slug."""
                return await dispatch("get_quiz", {"quiz_id": quiz_id, "slug": slug})
            tools.append(get_quiz)

        if include("search_knowledge"):
            @tool
            async def search_knowledge(query: str, limit: int = 5) -> str:
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
                parent_id: str = "",
            ) -> str:
                """Admin only: propose creating a category; execution requires Accept."""
                return await dispatch("create_category", {
                    "name": name, "description": description, "slug": slug,
                    "is_active": is_active, "parent_id": parent_id,
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
            async def get_my_quizzes(limit: int = 10) -> str:
                """Get quizzes owned by the signed-in user."""
                return await dispatch("get_my_quizzes", {"limit": limit})
            tools.append(get_my_quizzes)

        if include("get_quiz_history"):
            @tool
            async def get_quiz_history(limit: int = 10) -> str:
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
            async def get_all_attempts(limit: int = 20) -> str:
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
            async def web_search(query: str, limit: int = 5) -> str:
                """Search web only after internal sources are insufficient."""
                return await dispatch("web_search", {"query": query, "limit": limit})
            tools.append(web_search)

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
                limit: int = 50, action: str = "", resource_type: str = "",
            ) -> str:
                """Admin only: list recent audit events without secrets."""
                return await dispatch("list_audit_events", {
                    "limit": limit, "action": action, "resource_type": resource_type,
                })
            tools.append(list_audit_events)

        if include("create_quiz"):
            @tool
            async def create_quiz(
                title: str, slug: str, category_id: str, difficulty_level: str,
                time_limit: float, quiz_type: str, description: str = "",
                max_attempts: float = 0, passing_score: float = 0,
                is_active: bool = False, instructions: str = "",
            ) -> str:
                """Propose creating a quiz; execution still requires Accept."""
                return await dispatch("create_quiz", {
                    "title": title, "slug": slug, "category_id": category_id,
                    "difficulty_level": difficulty_level, "time_limit": time_limit,
                    "quiz_type": quiz_type, "description": description,
                    "max_attempts": max_attempts, "passing_score": passing_score,
                    "is_active": is_active, "instructions": instructions,
                })
            tools.append(create_quiz)

        if include("create_quiz_with_questions"):
            @tool
            async def create_quiz_with_questions(
                title: str, slug: str, category_id: str, difficulty_level: str,
                time_limit: float, quiz_type: str, questions: list[dict[str, Any]],
                description: str = "", max_attempts: float = 0,
                passing_score: float = 0, instructions: str = "",
            ) -> str:
                """Propose one inactive quiz draft plus all questions/options; execution requires Accept."""
                return await dispatch("create_quiz_with_questions", {
                    "title": title, "slug": slug, "category_id": category_id,
                    "difficulty_level": difficulty_level, "time_limit": time_limit,
                    "quiz_type": quiz_type, "questions": questions,
                    "description": description, "max_attempts": max_attempts,
                    "passing_score": passing_score, "instructions": instructions,
                })
            tools.append(create_quiz_with_questions)

        if include("update_quiz"):
            @tool
            async def update_quiz(
                quiz_id: str, title: Optional[str] = None, slug: Optional[str] = None,
                category_id: Optional[str] = None, description: Optional[str] = None,
                difficulty_level: Optional[str] = None, time_limit: Optional[float] = None,
                max_attempts: Optional[float] = None, passing_score: Optional[float] = None,
                is_active: Optional[bool] = None, quiz_type: Optional[str] = None,
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
                quiz_id: str, question_text: str, question_type: str,
                options: list[dict[str, Any]], points: float = 1,
                time_limit: float = 0, explanation: str = "",
                difficulty_level: str = "", sort_order: int = 0,
                is_required: bool = True,
            ) -> str:
                """Propose creating a question; execution still requires Accept."""
                return await dispatch("create_question", {
                    "quiz_id": quiz_id, "question_text": question_text,
                    "question_type": question_type, "options": options, "points": points,
                    "time_limit": time_limit, "explanation": explanation,
                    "difficulty_level": difficulty_level, "sort_order": sort_order,
                    "is_required": is_required,
                })
            tools.append(create_question)

        if include("update_question"):
            @tool
            async def update_question(
                question_id: str, question_text: Optional[str] = None,
                question_type: Optional[str] = None, points: Optional[float] = None,
                time_limit: Optional[float] = None, explanation: Optional[str] = None,
                difficulty_level: Optional[str] = None, sort_order: Optional[int] = None,
                is_required: Optional[bool] = None,
                options: Optional[list[dict[str, Any]]] = None,
            ) -> str:
                """Propose updating a question; execution still requires Accept."""
                return await dispatch("update_question", {
                    "question_id": question_id, "question_text": question_text,
                    "question_type": question_type, "points": points,
                    "time_limit": time_limit, "explanation": explanation,
                    "difficulty_level": difficulty_level, "sort_order": sort_order,
                    "is_required": is_required, "options": options,
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
                quiz_id: str, question_orders: list[dict[str, Any]],
            ) -> str:
                """Propose reordering questions in an owned quiz; execution requires Accept."""
                return await dispatch("reorder_questions", {
                    "quiz_id": quiz_id, "question_orders": question_orders,
                })
            tools.append(reorder_questions)

        if include("import_knowledge_url"):
            @tool
            async def import_knowledge_url(
                url: str, title: str = "", visibility: str = "PRIVATE",
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
                source_id: str, status: str, rejection_reason: str = "",
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
                blocks: list[dict[str, Any]] = [], actions: list[dict[str, Any]] = [],
            ) -> str:
                """Render generic UI only when no server-owned interaction policy applies."""
                return await dispatch("render_ui", {
                    "title": title, "description": description,
                    "blocks": blocks, "actions": actions,
                })
            tools.append(render_ui)

        return tools
