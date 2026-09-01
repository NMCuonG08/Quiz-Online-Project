from __future__ import annotations

from typing import Any

import unicodedata

from pydantic import BaseModel, ConfigDict, Field

from .base import CapabilityDescriptor


class QualityCheck(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=128)
    passed: bool
    blocking: bool = True
    path: str = ""
    message: str = Field(default="", max_length=500)


class QualityReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    passed: bool
    question_count: int = Field(default=0, ge=0)
    checks: list[QualityCheck] = Field(default_factory=list)
    blocking_failures: list[str] = Field(default_factory=list)
    requires_human_review: bool = False


class QuestionQualityCapability:
    """Deterministic question-content validation before persistence or publish."""

    descriptor = CapabilityDescriptor(
        capability_id="question_quality",
        supported_intents=frozenset({"quiz_create", "question_create", "question_update", "quiz_publish"}),
        allowed_scopes=frozenset({"creator", "admin"}),
        tools=frozenset({"create_quiz_with_questions", "create_question", "update_question", "get_quiz_build_status"}),
        access="read_write",
    )

    @staticmethod
    def validate_question_payload(payload: dict[str, Any]) -> None:
        report = QuestionQualityCapability.inspect_question(payload)
        QuestionQualityCapability._raise_for_report(report)

    @staticmethod
    def inspect_question(payload: dict[str, Any]) -> QualityReport:
        question_type = str(payload.get("question_type") or "")
        options = payload.get("options") or []
        checks: list[QualityCheck] = []

        def check(code: str, passed: bool, message: str, path: str = "") -> None:
            checks.append(QualityCheck(
                code=code, passed=passed, blocking=True, path=path, message=message,
            ))

        check(
            "QUESTION_TEXT_REQUIRED",
            bool(str(payload.get("question_text") or "").strip()),
            "Câu hỏi cần có nội dung",
            "question_text",
        )
        check(
            "QUESTION_TYPE_SUPPORTED",
            question_type in {"SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK", "ESSAY", "MATCHING"},
            "Loại câu hỏi chưa được hỗ trợ",
            "question_type",
        )
        for index, option in enumerate(options, start=1):
            check(
                "QUESTION_OPTION_TEXT_REQUIRED",
                isinstance(option, dict) and bool(str(option.get("option_text") or "").strip()),
                f"Đáp án {index} cần có nội dung option_text",
                f"options.{index - 1}.option_text",
            )
        option_keys = [
            QuestionQualityCapability._normalize_text(str(option.get("option_text") or ""))
            for option in options if isinstance(option, dict)
        ]
        if len(option_keys) != len(set(option_keys)):
            check(
                "QUESTION_OPTION_DUPLICATE",
                False,
                "Các đáp án không được trùng nhau",
                "options",
            )
        if question_type in {"SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"}:
            check(
                "QUESTION_OPTIONS_REQUIRED",
                len(options) >= 2,
                "Câu hỏi lựa chọn cần ít nhất 2 đáp án",
                "options",
            )
            correct_count = sum(
                1 for option in options
                if isinstance(option, dict) and option.get("is_correct") is True
            )
            if question_type in {"SINGLE_CHOICE", "TRUE_FALSE"}:
                check(
                    "QUESTION_CORRECT_OPTION_INVALID",
                    correct_count == 1,
                    "Cần đúng 1 đáp án đúng",
                    "options",
                )
            if question_type == "MULTIPLE_CHOICE":
                check(
                    "QUESTION_CORRECT_OPTION_INVALID",
                    correct_count >= 1,
                    "Cần ít nhất 1 đáp án đúng",
                    "options",
                )
        failures = [
            check.message for check in checks if check.blocking and not check.passed
        ]
        return QualityReport(
            passed=not failures,
            question_count=1,
            checks=checks,
            blocking_failures=failures,
        )

    @staticmethod
    def inspect_quiz(payload: dict[str, Any]) -> QualityReport:
        questions = payload.get("questions")
        if not isinstance(questions, list) or not questions:
            return QualityReport(
                passed=False,
                question_count=0,
                checks=[QualityCheck(
                    code="QUIZ_QUESTIONS_REQUIRED",
                    passed=False,
                    path="questions",
                    message="Cần ít nhất một câu hỏi",
                )],
                blocking_failures=["Cần ít nhất một câu hỏi"],
            )

        checks: list[QualityCheck] = []
        question_keys: list[str] = []
        for index, question in enumerate(questions):
            if not isinstance(question, dict):
                checks.append(QualityCheck(
                    code="QUESTION_OBJECT_INVALID",
                    passed=False,
                    path=f"questions.{index}",
                    message=f"Câu hỏi {index + 1} có dữ liệu không hợp lệ",
                ))
                continue
            report = QuestionQualityCapability.inspect_question(question)
            for check in report.checks:
                checks.append(check.model_copy(update={
                    "path": f"questions.{index}.{check.path}".rstrip("."),
                }))
            question_keys.append(QuestionQualityCapability._normalize_text(
                str(question.get("question_text") or "")
            ))

        if len(question_keys) != len(set(question_keys)):
            checks.append(QualityCheck(
                code="QUESTION_DUPLICATE",
                passed=False,
                path="questions",
                message="Quiz có câu hỏi bị trùng nội dung",
            ))
        failures = [check.message for check in checks if check.blocking and not check.passed]
        return QualityReport(
            passed=not failures,
            question_count=len(questions),
            checks=checks,
            blocking_failures=failures,
            requires_human_review=bool(questions),
        )

    @staticmethod
    def validate_quiz_payload(payload: dict[str, Any]) -> QualityReport:
        report = QuestionQualityCapability.inspect_quiz(payload)
        QuestionQualityCapability._raise_for_report(report)
        return report

    @staticmethod
    def _raise_for_report(report: QualityReport) -> None:
        if report.passed:
            return
        failed = [
            check for check in report.checks if check.blocking and not check.passed
        ]
        priority = (
            "QUESTION_OPTION_TEXT_REQUIRED",
            "QUESTION_OPTIONS_REQUIRED",
            "QUESTION_CORRECT_OPTION_INVALID",
            "QUESTION_DUPLICATE",
            "QUESTION_OPTION_DUPLICATE",
            "QUESTION_TEXT_REQUIRED",
            "QUESTION_TYPE_SUPPORTED",
            "QUIZ_QUESTIONS_REQUIRED",
        )
        first = next(
            (check for code in priority for check in failed if check.code == code),
            None,
        )
        if first is None:
            first = next(
            (check for check in report.checks if check.blocking and not check.passed),
            None,
            )
        if first and first.code == "QUESTION_OPTION_TEXT_REQUIRED":
            raise ValueError(
                f"QUESTION_OPTION_TEXT_REQUIRED: {first.message}"
            )
        if first and first.code == "QUESTION_OPTIONS_REQUIRED":
            raise ValueError("QUESTION_OPTIONS_REQUIRED: Câu hỏi lựa chọn cần ít nhất 2 đáp án")
        if first and first.code == "QUESTION_CORRECT_OPTION_INVALID":
            raise ValueError("QUESTION_CORRECT_OPTION_INVALID: " + first.message)
        if first and first.code == "QUIZ_QUESTIONS_REQUIRED":
            raise ValueError("QUIZ_QUESTIONS_REQUIRED: Cần ít nhất một câu hỏi")
        raise ValueError("QUESTION_QUALITY_FAILED: " + (report.blocking_failures[0] if report.blocking_failures else "Dữ liệu câu hỏi chưa hợp lệ"))

    @staticmethod
    def _normalize_text(value: str) -> str:
        ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
        return " ".join(ascii_value.lower().split())
