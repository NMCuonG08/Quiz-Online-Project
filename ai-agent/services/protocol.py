from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class ChatPageContext(BaseModel):
    route: str = Field(default="/", min_length=1, max_length=500, pattern=r"^/")
    selected_quiz_id: Optional[str] = Field(default=None, max_length=128)
    selected_knowledge_source_id: Optional[str] = Field(default=None, max_length=128)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    user_id: str = "guest"
    session_id: Optional[str] = None
    locale: str = "vi"
    scope: Literal["learner", "creator", "admin"] = "learner"
    context: ChatPageContext = Field(default_factory=ChatPageContext)


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
