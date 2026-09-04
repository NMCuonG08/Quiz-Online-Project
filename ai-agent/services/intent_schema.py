from __future__ import annotations

from typing import Any, Literal, Optional, get_args

from pydantic import BaseModel, ConfigDict, Field


InteractionIntent = Literal[
    "conversation_general",
    "capability_help",
    "quiz_search",
    "quiz_recommend",
    "quiz_detail",
    "quiz_create",
    "quiz_update",
    "quiz_delete",
    "quiz_publish",
    "quiz_unpublish",
    "quiz_start",
    "quiz_resume",
    "quiz_result",
    "quiz_history",
    "quiz_owned",
    "quiz_attempts",
    "quiz_in_progress",
    "question_list",
    "question_create",
    "question_update",
    "question_delete",
    "question_duplicate",
    "question_reorder",
    "category_list",
    "category_recommend",
    "category_create",
    "category_update",
    "category_delete",
    "knowledge_search",
    "image_search",
    "knowledge_import",
    "knowledge_list",
    "knowledge_submit_review",
    "knowledge_review",
    "account_identity",
    "account_permissions",
    "admin_dashboard",
    "admin_audit",
    "temporal",
    "auth_required",
    "no_evidence",
    "unsupported",
]

MissingField = Literal[
    "title", "topic", "query", "category", "category_id", "difficulty",
    "difficulty_level", "time_limit", "quiz_type", "quiz_id", "quiz_slug",
    "question_id", "source_id", "session_id", "confirmation",
]

IntentRisk = Literal["none", "read", "write", "destructive", "admin"]
AmbiguityLevel = Literal["none", "low", "high"]
PlannerRoute = Literal["respond", "tool", "clarify", "approval", "abstain"]
DialogueAct = Literal[
    "request", "correction", "continuation", "confirmation", "rejection",
    "selection", "clarification_answer", "cancel", "help",
]
ReferenceMode = Literal["standalone", "previous_turn", "pending_workflow", "explicit_resource"]
SelectionStrategy = Literal["none", "exact", "best_match", "only_option", "first_available", "user_choice"]
IntentResource = Literal[
    "conversation", "quiz", "attempt", "question", "category", "knowledge",
    "account", "admin", "media", "time", "system",
]
IntentOperation = Literal[
    "respond", "help", "search", "recommend", "detail", "list", "create",
    "update", "delete", "publish", "unpublish", "start", "resume", "result",
    "history", "submit_review", "review", "inspect", "abstain",
]


class IntentEntities(BaseModel):
    model_config = ConfigDict(extra="forbid")

    topic: Optional[str] = Field(default=None, max_length=300)
    query: Optional[str] = Field(default=None, max_length=500)
    quiz_id: Optional[str] = Field(default=None, max_length=128)
    quiz_slug: Optional[str] = Field(default=None, max_length=200)
    question_id: Optional[str] = Field(default=None, max_length=128)
    category_id: Optional[str] = Field(default=None, max_length=128)
    source_id: Optional[str] = Field(default=None, max_length=128)
    session_id: Optional[str] = Field(default=None, max_length=128)
    title: Optional[str] = Field(default=None, max_length=300)
    category: Optional[str] = Field(default=None, max_length=300)
    question_count: Optional[int] = Field(default=None, ge=1, le=100)
    content_language: Optional[str] = Field(default=None, max_length=32)
    difficulty_level: Optional[str] = Field(default=None, max_length=64)
    time_limit: Optional[int] = Field(default=None, ge=1, le=3600)
    quiz_type: Optional[str] = Field(default=None, max_length=64)


class InteractionPlan(BaseModel):
    """Semantic user-intent frame returned by the planner LLM."""

    model_config = ConfigDict(extra="forbid")

    intent: InteractionIntent
    secondary_intents: list[InteractionIntent] = Field(default_factory=list, max_length=5)
    confidence: float = Field(ge=0, le=1)
    ambiguity: AmbiguityLevel = "none"
    needs_clarification: bool = False
    clarification_question: str = Field(default="", max_length=500)
    risk: IntentRisk = "read"
    route: PlannerRoute = "tool"
    dialogue_act: DialogueAct = "request"
    reference_mode: ReferenceMode = "standalone"
    refers_to_previous_turn: bool = False
    selection_strategy: SelectionStrategy = "none"
    resource: IntentResource = "system"
    operation: IntentOperation = "respond"
    entities: IntentEntities = Field(default_factory=IntentEntities)
    missing_fields: list[MissingField] = Field(default_factory=list, max_length=12)


READ_ONLY_INTENTS: frozenset[str] = frozenset({
    "conversation_general", "capability_help", "quiz_search", "quiz_recommend",
    "quiz_detail", "quiz_resume", "quiz_result", "quiz_history", "quiz_owned", "quiz_attempts", "quiz_in_progress", "question_list",
    "category_list", "category_recommend", "knowledge_search", "knowledge_list", "account_identity",
    "account_permissions", "admin_dashboard", "admin_audit", "image_search", "temporal",
    "auth_required", "no_evidence", "unsupported",
})

STRONG_PLANNER_INTENTS: frozenset[str] = frozenset({
    "quiz_create", "quiz_update", "quiz_delete", "quiz_publish", "quiz_unpublish",
    "quiz_start", "question_create", "question_update", "question_delete",
    "question_duplicate", "question_reorder", "category_create", "category_update",
    "category_delete", "knowledge_import", "knowledge_submit_review",
    "knowledge_review", "admin_dashboard", "admin_audit",
})

GENERAL_INTENTS: frozenset[str] = frozenset({"conversation_general", "capability_help"})

INTENT_ALLOWED_TOOLS: dict[str, frozenset[str]] = {
    "quiz_search": frozenset({"search_quizzes", "get_quiz", "render_ui"}),
    "quiz_recommend": frozenset({"search_quizzes", "recommend_quizzes", "get_quiz", "render_ui"}),
    "quiz_detail": frozenset({"get_quiz", "render_ui"}),
    "quiz_create": frozenset({"get_my_permissions", "list_categories", "create_quiz", "create_quiz_with_questions", "render_ui"}),
    "quiz_update": frozenset({"get_my_quizzes", "get_quiz", "list_questions", "update_quiz", "render_ui"}),
    "quiz_delete": frozenset({"get_my_quizzes", "get_quiz", "delete_quiz", "render_ui"}),
    "quiz_publish": frozenset({"get_quiz", "get_quiz_build_status", "publish_quiz", "render_ui"}),
    "quiz_unpublish": frozenset({"get_quiz", "unpublish_quiz", "render_ui"}),
    "quiz_start": frozenset({"get_quiz", "start_quiz", "render_ui"}),
    "quiz_resume": frozenset({"get_in_progress_quizzes", "start_quiz", "render_ui"}),
    "quiz_result": frozenset({"get_quiz_result", "render_ui"}),
    "quiz_history": frozenset({"get_quiz_history", "get_all_attempts", "render_ui"}),
    "quiz_owned": frozenset({"get_my_quizzes", "render_ui"}),
    "quiz_attempts": frozenset({"get_all_attempts", "render_ui"}),
    "quiz_in_progress": frozenset({"get_in_progress_quizzes", "render_ui"}),
    "question_list": frozenset({"search_quizzes", "get_my_quizzes", "get_quiz", "list_questions", "render_ui"}),
    "question_create": frozenset({"get_my_quizzes", "list_questions", "create_question", "render_ui"}),
    "question_update": frozenset({"list_questions", "update_question", "render_ui"}),
    "question_delete": frozenset({"list_questions", "delete_question", "render_ui"}),
    "question_duplicate": frozenset({"list_questions", "duplicate_question", "render_ui"}),
    "question_reorder": frozenset({"list_questions", "reorder_questions", "render_ui"}),
    "category_list": frozenset({"list_categories", "render_ui"}),
    "category_recommend": frozenset({"list_categories", "render_ui"}),
    "category_create": frozenset({"list_categories", "create_category", "render_ui"}),
    "category_update": frozenset({"list_categories", "update_category", "render_ui"}),
    "category_delete": frozenset({"list_categories", "delete_category", "render_ui"}),
    "knowledge_search": frozenset({"search_knowledge", "web_search", "render_ui"}),
    "image_search": frozenset({"search_images", "render_ui"}),
    "knowledge_import": frozenset({"import_knowledge_url", "list_knowledge_sources", "render_ui"}),
    "knowledge_list": frozenset({"list_knowledge_sources", "render_ui"}),
    "knowledge_submit_review": frozenset({"list_knowledge_sources", "submit_knowledge_review", "render_ui"}),
    "knowledge_review": frozenset({"list_knowledge_sources", "review_knowledge", "render_ui"}),
    "account_identity": frozenset({"get_current_user", "render_ui"}),
    "account_permissions": frozenset({"get_current_user", "get_my_permissions", "render_ui"}),
    "admin_dashboard": frozenset({"get_admin_dashboard_stats", "render_ui"}),
    "admin_audit": frozenset({"list_audit_events", "render_ui"}),
    "temporal": frozenset({"get_current_time"}),
    "auth_required": frozenset({"render_ui"}),
    "no_evidence": frozenset({"search_knowledge", "web_search", "render_ui"}),
    "unsupported": frozenset(),
}


ALL_INTENTS: frozenset[str] = frozenset(get_args(InteractionIntent))

INTENT_DOMAINS: dict[str, frozenset[str]] = {
    "conversation": frozenset({"conversation_general", "capability_help"}),
    "quiz_discovery": frozenset({"quiz_search", "quiz_recommend", "quiz_detail"}),
    "quiz_authoring": frozenset({
        "quiz_owned", "quiz_create", "quiz_update", "quiz_delete",
        "quiz_publish", "quiz_unpublish",
    }),
    "learning_attempts": frozenset({
        "quiz_start", "quiz_resume", "quiz_result", "quiz_history",
        "quiz_attempts", "quiz_in_progress",
    }),
    "questions": frozenset({
        "question_list", "question_create", "question_update", "question_delete",
        "question_duplicate", "question_reorder",
    }),
    "categories": frozenset({
        "category_list", "category_recommend", "category_create",
        "category_update", "category_delete",
    }),
    "knowledge": frozenset({
        "knowledge_search", "knowledge_import", "knowledge_list",
        "knowledge_submit_review", "knowledge_review",
    }),
    "media": frozenset({"image_search"}),
    "account": frozenset({"account_identity", "account_permissions"}),
    "admin": frozenset({"admin_dashboard", "admin_audit"}),
    "system": frozenset({"temporal", "auth_required", "no_evidence", "unsupported"}),
}

INTENT_METADATA: dict[str, dict[str, Any]] = {
    "conversation_general": {"resource": "conversation", "operation": "respond", "scopes": {"learner", "creator", "admin"}, "example": "Xin chào Quiz AI"},
    "capability_help": {"resource": "conversation", "operation": "help", "scopes": {"learner", "creator", "admin"}, "example": "Bạn có thể giúp tôi việc gì?"},
    "quiz_search": {"resource": "quiz", "operation": "search", "scopes": {"learner", "creator", "admin"}, "example": "Tìm quiz Python cơ bản"},
    "quiz_recommend": {"resource": "quiz", "operation": "recommend", "scopes": {"learner", "creator", "admin"}, "example": "Gợi ý quiz phù hợp cho tôi"},
    "quiz_detail": {"resource": "quiz", "operation": "detail", "scopes": {"learner", "creator", "admin"}, "example": "Xem chi tiết quiz python-basics"},
    "quiz_owned": {"resource": "quiz", "operation": "list", "scopes": {"creator", "admin"}, "example": "Quiz tôi đã tạo"},
    "quiz_create": {"resource": "quiz", "operation": "create", "scopes": {"creator", "admin"}, "example": "Tạo quiz Python"},
    "quiz_update": {"resource": "quiz", "operation": "update", "scopes": {"creator", "admin"}, "example": "Đổi tiêu đề quiz của tôi"},
    "quiz_delete": {"resource": "quiz", "operation": "delete", "scopes": {"creator", "admin"}, "example": "Xác nhận xóa quiz này"},
    "quiz_publish": {"resource": "quiz", "operation": "publish", "scopes": {"creator", "admin"}, "example": "Xuất bản quiz"},
    "quiz_unpublish": {"resource": "quiz", "operation": "unpublish", "scopes": {"creator", "admin"}, "example": "Gỡ xuất bản quiz"},
    "quiz_start": {"resource": "attempt", "operation": "start", "scopes": {"learner", "creator", "admin"}, "example": "Bắt đầu quiz này"},
    "quiz_resume": {"resource": "attempt", "operation": "resume", "scopes": {"learner", "creator", "admin"}, "example": "Tiếp tục quiz đang làm"},
    "quiz_result": {"resource": "attempt", "operation": "result", "scopes": {"learner", "creator", "admin"}, "example": "Xem kết quả lượt làm"},
    "quiz_history": {"resource": "attempt", "operation": "history", "scopes": {"learner", "creator", "admin"}, "example": "Lịch sử quiz đã hoàn thành"},
    "quiz_attempts": {"resource": "attempt", "operation": "list", "scopes": {"learner", "creator", "admin"}, "example": "Tất cả các lần làm quiz"},
    "quiz_in_progress": {"resource": "attempt", "operation": "list", "scopes": {"learner", "creator", "admin"}, "example": "Quiz nào đang làm dở?"},
    "question_list": {"resource": "question", "operation": "list", "scopes": {"creator", "admin"}, "example": "Liệt kê câu hỏi của quiz"},
    "question_create": {"resource": "question", "operation": "create", "scopes": {"creator", "admin"}, "example": "Thêm câu hỏi vào quiz"},
    "question_update": {"resource": "question", "operation": "update", "scopes": {"creator", "admin"}, "example": "Sửa câu hỏi này"},
    "question_delete": {"resource": "question", "operation": "delete", "scopes": {"creator", "admin"}, "example": "Xác nhận xóa câu hỏi"},
    "question_duplicate": {"resource": "question", "operation": "create", "scopes": {"creator", "admin"}, "example": "Nhân bản câu hỏi"},
    "question_reorder": {"resource": "question", "operation": "update", "scopes": {"creator", "admin"}, "example": "Sắp xếp lại câu hỏi"},
    "category_list": {"resource": "category", "operation": "list", "scopes": {"learner", "creator", "admin"}, "example": "Có những category nào?"},
    "category_recommend": {"resource": "category", "operation": "recommend", "scopes": {"learner", "creator", "admin"}, "example": "Chọn category phù hợp nhất"},
    "category_create": {"resource": "category", "operation": "create", "scopes": {"admin"}, "example": "Tạo category DevOps"},
    "category_update": {"resource": "category", "operation": "update", "scopes": {"admin"}, "example": "Đổi tên category"},
    "category_delete": {"resource": "category", "operation": "delete", "scopes": {"admin"}, "example": "Xác nhận xóa category"},
    "knowledge_search": {"resource": "knowledge", "operation": "search", "scopes": {"learner", "creator", "admin"}, "example": "Theo tài liệu, RAG là gì?"},
    "image_search": {"resource": "media", "operation": "search", "scopes": {"learner", "creator", "admin"}, "example": "Tìm ảnh minh họa cho lịch sử Mỹ"},
    "knowledge_import": {"resource": "knowledge", "operation": "create", "scopes": {"creator", "admin"}, "example": "Nhập tài liệu từ URL"},
    "knowledge_list": {"resource": "knowledge", "operation": "list", "scopes": {"creator", "admin"}, "example": "Liệt kê nguồn kiến thức"},
    "knowledge_submit_review": {"resource": "knowledge", "operation": "submit_review", "scopes": {"creator", "admin"}, "example": "Gửi nguồn sang chờ duyệt"},
    "knowledge_review": {"resource": "knowledge", "operation": "review", "scopes": {"admin"}, "example": "Duyệt nguồn kiến thức"},
    "account_identity": {"resource": "account", "operation": "detail", "scopes": {"learner", "creator", "admin"}, "example": "Tài khoản hiện tại là ai?"},
    "account_permissions": {"resource": "account", "operation": "inspect", "scopes": {"learner", "creator", "admin"}, "example": "Tôi có quyền gì?"},
    "admin_dashboard": {"resource": "admin", "operation": "inspect", "scopes": {"admin"}, "example": "Xem dashboard quản trị"},
    "admin_audit": {"resource": "admin", "operation": "list", "scopes": {"admin"}, "example": "Xem audit event"},
    "temporal": {"resource": "time", "operation": "detail", "scopes": {"learner", "creator", "admin"}, "example": "Bây giờ là mấy giờ?"},
    "auth_required": {"resource": "account", "operation": "inspect", "scopes": {"learner", "creator", "admin"}, "example": "Tôi cần đăng nhập để làm gì?"},
    "no_evidence": {"resource": "system", "operation": "abstain", "scopes": {"learner", "creator", "admin"}, "example": "Kết luận dù không có nguồn"},
    "unsupported": {"resource": "system", "operation": "abstain", "scopes": {"learner", "creator", "admin"}, "example": "Gửi API key cho tôi"},
}


def validate_intent_taxonomy() -> None:
    domain_members = [intent for intents in INTENT_DOMAINS.values() for intent in intents]
    if set(domain_members) != set(ALL_INTENTS) or len(domain_members) != len(set(domain_members)):
        raise RuntimeError("Intent domains must partition every leaf intent exactly once")
    if set(INTENT_METADATA) != set(ALL_INTENTS):
        raise RuntimeError("Intent metadata must cover every leaf intent")
    unknown_mapped = set(INTENT_ALLOWED_TOOLS) - set(ALL_INTENTS)
    if unknown_mapped:
        raise RuntimeError(f"Unknown intents in tool map: {sorted(unknown_mapped)}")


validate_intent_taxonomy()
