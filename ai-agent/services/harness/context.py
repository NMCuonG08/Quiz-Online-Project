from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any, Iterable, Optional

from pydantic import BaseModel, ConfigDict, Field


TrustLevel = str


class ContextLimits(BaseModel):
    model_config = ConfigDict(extra="forbid")

    max_history_messages: int = Field(default=20, ge=0, le=200)
    max_history_chars: int = Field(default=12_000, ge=0, le=200_000)
    max_section_chars: int = Field(default=8_000, ge=1, le=200_000)
    max_total_context_chars: int = Field(default=40_000, ge=1, le=500_000)


class ContextSection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=128)
    content: str = Field(max_length=200_000)
    trust: TrustLevel = Field(default="untrusted", max_length=32)
    priority: int = Field(default=50, ge=0, le=100)


class ContextSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    system_prompt: str
    history: list[dict[str, str]] = Field(default_factory=list)
    user_message: str
    sections: list[ContextSection] = Field(default_factory=list)
    trimmed: bool = False
    total_chars: int = Field(default=0, ge=0)

    def system_message(self) -> str:
        if not self.sections:
            return self.system_prompt
        sections = "\n\n".join(
            f"[{section.trust.upper()} SECTION: {section.name}]\n{section.content}"
            for section in self.sections
        )
        return f"{self.system_prompt}\n\nRUNTIME CONTEXT:\n{sections}"


@dataclass(frozen=True)
class ContextBuilder:
    limits: ContextLimits = field(default_factory=ContextLimits)

    def build(
        self,
        *,
        system_prompt: str,
        history: Iterable[dict[str, Any]],
        user_message: str,
        interaction_plan: Optional[dict[str, Any]] = None,
        page_context: Optional[dict[str, Any]] = None,
        memory: Optional[Iterable[Any]] = None,
        evidence: Optional[Iterable[Any]] = None,
    ) -> ContextSnapshot:
        sections: list[ContextSection] = []
        if interaction_plan:
            sections.append(ContextSection(
                name="validated_interaction_plan",
                content=json.dumps(interaction_plan, ensure_ascii=False, default=str),
                trust="trusted",
                priority=100,
            ))
        if page_context:
            sections.append(ContextSection(
                name="page_context_data",
                content=json.dumps(page_context, ensure_ascii=False, default=str),
                trust="context_data",
                priority=70,
            ))
        memory_content = self._serialize_items(memory)
        if memory_content:
            sections.append(ContextSection(
                name="namespaced_memory",
                content=memory_content,
                trust="untrusted_data",
                priority=50,
            ))
        evidence_content = self._serialize_items(evidence)
        if evidence_content:
            sections.append(ContextSection(
                name="retrieved_evidence",
                content=evidence_content,
                trust="untrusted_data",
                priority=80,
            ))

        bounded_sections, sections_trimmed = self._bound_sections(sections)
        bounded_history, history_trimmed = self._bound_history(history)
        bounded_user_message = user_message
        rendered_length = len(system_prompt) + len(bounded_user_message)
        rendered_length += sum(len(section.content) for section in bounded_sections)
        rendered_length += sum(len(item["content"]) for item in bounded_history)
        trimmed = sections_trimmed or history_trimmed

        if rendered_length > self.limits.max_total_context_chars:
            trimmed = True
            history_budget = max(
                0,
                self.limits.max_total_context_chars
                - len(system_prompt)
                - len(bounded_user_message)
                - sum(len(section.content) for section in bounded_sections),
            )
            while (
                bounded_history
                and sum(len(item["content"]) for item in bounded_history) > history_budget
            ):
                bounded_history.pop(0)
            bounded_sections = self._trim_to_total(
                system_prompt,
                bounded_user_message,
                bounded_sections,
                bounded_history,
            )
            rendered_length = len(system_prompt) + len(bounded_user_message)
            rendered_length += sum(len(section.content) for section in bounded_sections)
            rendered_length += sum(len(item["content"]) for item in bounded_history)
            if rendered_length > self.limits.max_total_context_chars:
                user_budget = max(
                    1,
                    self.limits.max_total_context_chars
                    - len(system_prompt)
                    - sum(len(section.content) for section in bounded_sections)
                    - sum(len(item["content"]) for item in bounded_history),
                )
                bounded_user_message = self._clip(user_message, user_budget)
                rendered_length = len(system_prompt) + len(bounded_user_message)
                rendered_length += sum(len(section.content) for section in bounded_sections)
                rendered_length += sum(len(item["content"]) for item in bounded_history)

        return ContextSnapshot(
            system_prompt=system_prompt,
            history=bounded_history,
            user_message=bounded_user_message,
            sections=bounded_sections,
            trimmed=trimmed,
            total_chars=rendered_length,
        )

    def _bound_history(
        self, history: Iterable[dict[str, Any]],
    ) -> tuple[list[dict[str, str]], bool]:
        clean: list[dict[str, str]] = []
        trimmed = False
        for item in history:
            role = str(item.get("role") or "")
            if role not in {"user", "assistant"}:
                trimmed = True
                continue
            content = str(item.get("content") or "")
            if not content:
                trimmed = True
                continue
            if len(content) > self.limits.max_section_chars:
                content = self._clip(content, self.limits.max_section_chars)
                trimmed = True
            clean.append({"role": role, "content": content})

        if len(clean) > self.limits.max_history_messages:
            clean = clean[-self.limits.max_history_messages:]
            trimmed = True

        while sum(len(item["content"]) for item in clean) > self.limits.max_history_chars:
            if not clean:
                break
            clean.pop(0)
            trimmed = True
        return clean, trimmed

    def _bound_sections(
        self, sections: list[ContextSection],
    ) -> tuple[list[ContextSection], bool]:
        bounded: list[ContextSection] = []
        trimmed = False
        for section in sorted(sections, key=lambda item: item.priority, reverse=True):
            content = section.content
            if len(content) > self.limits.max_section_chars:
                content = self._clip(content, self.limits.max_section_chars)
                trimmed = True
            bounded.append(section.model_copy(update={"content": content}))
        return bounded, trimmed

    def _trim_to_total(
        self,
        system_prompt: str,
        user_message: str,
        sections: list[ContextSection],
        history: list[dict[str, str]],
    ) -> list[ContextSection]:
        fixed = len(system_prompt) + len(user_message)
        history_length = sum(len(item["content"]) for item in history)
        remaining = max(0, self.limits.max_total_context_chars - fixed - history_length)
        result: list[ContextSection] = []
        for section in sections:
            if remaining <= 0:
                break
            content = self._clip(section.content, remaining)
            if content:
                result.append(section.model_copy(update={"content": content}))
                remaining -= len(content)
        return result

    @staticmethod
    def _serialize_items(items: Optional[Iterable[Any]]) -> str:
        if not items:
            return ""
        values: list[str] = []
        for item in items:
            if isinstance(item, BaseModel):
                values.append(item.model_dump_json())
            elif isinstance(item, dict):
                values.append(json.dumps(item, ensure_ascii=False, default=str))
            else:
                values.append(str(item))
        return "\n".join(values)

    @staticmethod
    def _clip(value: str, limit: int) -> str:
        if limit <= 0:
            return ""
        if len(value) <= limit:
            return value
        suffix = "\n...[truncated by context budget]"
        return value[:max(0, limit - len(suffix))] + suffix
