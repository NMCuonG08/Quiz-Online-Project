from __future__ import annotations

from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class ChatPageContext(BaseModel):
    route: str = Field(default="/", min_length=1, max_length=500, pattern=r"^/")
    selected_quiz_id: Optional[str] = Field(default=None, max_length=128)
    selected_knowledge_source_id: Optional[str] = Field(default=None, max_length=128)


class ChatFormSubmission(BaseModel):
    """Structured values from a server-rendered form.

    `form_id` selects a server-owned handler. Client values are always
    untrusted and must still pass domain validation and authorization.
    """

    form_id: str = Field(
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]*$",
    )
    submission_id: Optional[str] = Field(
        default=None,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]*$",
    )
    values: dict[str, Any]

    @field_validator("values")
    @classmethod
    def validate_values(cls, values: dict[str, Any]) -> dict[str, Any]:
        if len(values) > 40:
            raise ValueError("form submission có quá nhiều trường")
        normalized: dict[str, Any] = {}
        for key, value in values.items():
            if not key or len(key) > 128 or not key.replace("_", "").isalnum():
                raise ValueError("form field name không hợp lệ")
            if not isinstance(value, (str, int, float, bool)) and value is not None:
                raise ValueError("form value chỉ được là scalar")
            if isinstance(value, str) and len(value) > 4000:
                raise ValueError("form value quá dài")
            normalized[key] = value
        return normalized


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    user_id: str = ""
    session_id: Optional[str] = Field(default=None, max_length=128)
    locale: str = Field(default="vi", min_length=2, max_length=16, pattern=r"^[A-Za-z-]+$")
    scope: Literal["learner", "creator", "admin"] = "learner"
    context: ChatPageContext = Field(default_factory=ChatPageContext)
    form_submission: Optional[ChatFormSubmission] = None


class ReviewDecisionRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    notes: str = Field(default="", max_length=4000)


class UIAction(BaseModel):
    id: str
    label: str
    kind: Literal["navigate", "prompt", "approve"]
    value: str
    variant: Literal["primary", "secondary", "danger"] = "secondary"
    icon: Optional[str] = None

    @model_validator(mode="after")
    def validate_action(self):
        if self.kind == "navigate" and not self.value.startswith("/"):
            raise ValueError("navigate action chỉ được dùng internal path bắt đầu bằng /")
        if len(self.value) > 4000:
            raise ValueError("action value quá dài")
        return self


class UIItem(BaseModel):
    label: str
    value: str = ""
    description: str = ""
    badge: str = ""
    image_url: Optional[str] = None
    image_alt: Optional[str] = None

    @field_validator("image_url")
    @classmethod
    def safe_image_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        if not value.startswith(("https://", "http://", "/")):
            raise ValueError("image_url chỉ được là URL http(s) hoặc đường dẫn nội bộ")
        return value


class UIStat(BaseModel):
    label: str
    value: str
    trend: str = ""


class UIField(BaseModel):
    name: str
    label: str
    input_type: Literal["text", "number", "textarea", "select"] = "text"
    required: bool = False
    placeholder: str = ""
    options: List[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def safe_field_name(cls, value: str) -> str:
        if not value.replace("_", "").isalnum():
            raise ValueError("field name chỉ gồm chữ, số và dấu gạch dưới")
        return value


class UIBlock(BaseModel):
    id: str
    type: Literal["notice", "list", "table", "stats", "form"]
    title: str = ""
    description: str = ""
    tone: Literal["neutral", "info", "success", "warning", "danger"] = "neutral"
    items: List[UIItem] = Field(default_factory=list)
    columns: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)
    stats: List[UIStat] = Field(default_factory=list)
    fields: List[UIField] = Field(default_factory=list)
    submit_label: str = "Gửi"
    submit_prompt: str = ""


class UISurface(BaseModel):
    title: str = ""
    description: str = ""
    blocks: List[UIBlock] = Field(default_factory=list)
    actions: List[UIAction] = Field(default_factory=list)
