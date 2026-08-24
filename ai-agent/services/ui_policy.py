from __future__ import annotations

from typing import Any, Optional

from .protocol import UISurface


ACTION_REGISTRY = {
    "open_login": {"kind": "navigate", "value": "/auth/login", "label": "Đăng nhập", "variant": "primary"},
    "browse_quizzes": {"kind": "navigate", "value": "/quiz", "label": "Xem quiz", "variant": "secondary"},
    "open_quiz_create_creator": {"kind": "navigate", "value": "/user/quizzes/add", "label": "Mở form tạo quiz", "variant": "primary"},
    "open_quiz_create_admin": {"kind": "navigate", "value": "/admin/quizzes/add", "label": "Mở form tạo quiz", "variant": "primary"},
    "open_quiz_manager": {"kind": "navigate", "value": "/user/quizzes", "label": "Mở Quiz Manager", "variant": "primary"},
    "open_learning_history": {"kind": "navigate", "value": "/user", "label": "Xem lịch sử học", "variant": "secondary"},
}


class UiPolicyResolver:
    """Server-owned interaction templates. Model intent never owns action URLs or permissions."""

    def resolve(
        self, plan: dict[str, Any], scope: str, context: Optional[dict[str, Any]] = None
    ) -> Optional[UISurface]:
        intent = str(plan.get("intent") or "")
        missing_fields = [
            str(field) for field in plan.get("missing_fields", [])
            if isinstance(field, str)
        ]
        route = str((context or {}).get("route") or "/")

        if intent == "auth_required":
            return self._surface(
                "Cần đăng nhập",
                "Đăng nhập để xem dữ liệu cá nhân hoặc thực hiện thao tác quản lý.",
                [{"id": "auth-required", "type": "notice", "title": "Phiên chưa đăng nhập", "description": "Sau khi đăng nhập, agent sẽ kiểm tra quyền từ backend.", "tone": "info"}],
                ["open_login", "browse_quizzes"],
            )

        if intent == "quiz_create":
            if scope not in {"creator", "admin"}:
                if (context or {}).get("is_authenticated"):
                    in_quiz_manager = "/user/quizzes" in route or "/admin/quizzes" in route
                    if in_quiz_manager:
                        return self._surface(
                            "Thiếu quyền tạo quiz",
                            "Bạn đã đăng nhập nhưng backend không cấp permission quiz.create cho tài khoản này.",
                            [{"id": "creator-permission", "type": "notice", "title": "Thiếu quiz.create", "description": "Trang hiện tại không quyết định quyền; RBAC backend mới là nguồn sự thật.", "tone": "warning"}],
                            ["browse_quizzes"],
                        )
                    return self._surface(
                        "Mở Quiz Manager",
                        "Bạn đã đăng nhập. Vào Quiz Manager để agent kiểm tra quyền creator và tạo quiz.",
                        [{"id": "creator-route", "type": "notice", "title": "Đang ở chatbot học viên", "description": "Quyền tạo quiz chỉ được bật trong Quiz Manager.", "tone": "info"}],
                        ["open_quiz_manager", "browse_quizzes"],
                    )
                return self._surface(
                    "Tạo quiz",
                    "Bạn cần đăng nhập bằng tài khoản có quyền tạo quiz.",
                    [{"id": "creator-required", "type": "notice", "title": "Cần quyền creator", "description": "Bạn vẫn có thể xem các quiz công khai.", "tone": "info"}],
                    ["open_login", "browse_quizzes"],
                )
            fields = self._quiz_create_fields(missing_fields)
            action = "open_quiz_create_admin" if scope == "admin" else "open_quiz_create_creator"
            return self._surface(
                "Hoàn thiện quiz",
                "Agent sẽ dùng dữ liệu bạn gửi và category thật từ database trước khi đề xuất tạo.",
                [{
                    "id": "quiz-create-form", "type": "form", "title": "Thông tin còn thiếu",
                    "description": "Điền phần cần thiết, sau đó agent sẽ kiểm tra lại trước khi hiện Accept.",
                    "tone": "info", "fields": fields,
                    "submit_label": "Gửi cho agent",
                    "submit_prompt": "Dùng thông tin sau để tiếp tục tạo quiz:",
                }],
                [action],
            )

        if intent == "quiz_discovery":
            return self._surface(
                "Khám phá quiz",
                "Agent sẽ tìm theo chủ đề từ database. Bạn có thể mở danh sách để lọc thêm.",
                [{"id": "quiz-discovery", "type": "notice", "title": "Tìm trong database", "description": "Kết quả sẽ có citation tới quiz thật.", "tone": "info"}],
                ["browse_quizzes"],
            )

        if intent == "learning_history":
            return self._surface(
                "Lịch sử học",
                "Agent có thể đọc các lần làm bài đã hoàn thành để phân tích.",
                [{"id": "learning-history", "type": "notice", "title": "Dữ liệu cá nhân", "description": "Chỉ hiển thị dữ liệu của tài khoản hiện tại.", "tone": "info"}],
                ["open_learning_history"],
            )

        if intent == "knowledge_import" and scope in {"creator", "admin"}:
            return self._surface(
                "Nhập nguồn kiến thức",
                "Backend hỗ trợ .txt, .md và URL text/HTML. Nguồn mới luôn ở DRAFT và cần review trước khi public.",
                [{"id": "knowledge-import", "type": "notice", "title": "Luồng review", "description": "DRAFT → REVIEW → PUBLISHED hoặc QUARANTINED.", "tone": "info"}],
                [],
            )

        if intent == "quiz_delete":
            return self._surface(
                "Xóa dữ liệu cần xác nhận",
                "Agent chỉ đề xuất xóa sau khi bạn nói rõ xác nhận. Accept token chỉ dùng một lần.",
                [{"id": "delete-guard", "type": "notice", "title": "Thao tác phá hủy", "description": "Backend vẫn kiểm tra quyền sở hữu và RBAC khi Accept.", "tone": "warning"}],
                [],
            )

        if intent == "no_evidence":
            return self._surface(
                "Chưa đủ nguồn",
                "Agent sẽ không kết luận khi không có dữ liệu nội bộ hoặc citation đáng tin cậy.",
                [{"id": "no-evidence", "type": "notice", "title": "Abstain", "description": "Bạn có thể cung cấp thêm ngữ cảnh hoặc nguồn kiến thức.", "tone": "warning"}],
                [],
            )

        return None

    def _surface(
        self, title: str, description: str, blocks: list[dict[str, Any]], action_ids: list[str]
    ) -> UISurface:
        actions = []
        for action_id in action_ids:
            action = ACTION_REGISTRY[action_id]
            actions.append({"id": action_id, **action})
        return UISurface.model_validate({
            "title": title,
            "description": description,
            "blocks": [self._complete_block(block) for block in blocks],
            "actions": actions,
        })

    @staticmethod
    def _complete_block(block: dict[str, Any]) -> dict[str, Any]:
        return {
            "items": [], "columns": [], "rows": [], "stats": [], "fields": [],
            "submit_label": "Gửi", "submit_prompt": "",
            **block,
        }

    @staticmethod
    def _quiz_create_fields(missing_fields: list[str]) -> list[dict[str, Any]]:
        available = {
            "title": {"name": "title", "label": "Tên quiz", "input_type": "text", "required": True, "placeholder": "Ví dụ: Python cơ bản", "options": []},
            "category": {"name": "category", "label": "Chủ đề / category", "input_type": "text", "required": True, "placeholder": "Ví dụ: Lập trình", "options": []},
            "category_id": {"name": "category", "label": "Chủ đề / category", "input_type": "text", "required": True, "placeholder": "Ví dụ: Lập trình", "options": []},
            "difficulty": {"name": "difficulty", "label": "Độ khó", "input_type": "select", "required": True, "placeholder": "Chọn độ khó", "options": ["EASY", "MEDIUM", "HARD"]},
            "difficulty_level": {"name": "difficulty", "label": "Độ khó", "input_type": "select", "required": True, "placeholder": "Chọn độ khó", "options": ["EASY", "MEDIUM", "HARD"]},
            "time_limit": {"name": "time_limit", "label": "Thời gian (giây)", "input_type": "number", "required": True, "placeholder": "300", "options": []},
            "quiz_type": {"name": "quiz_type", "label": "Loại quiz", "input_type": "select", "required": True, "placeholder": "Chọn loại", "options": ["MULTIPLE_CHOICE", "SINGLE_CHOICE", "TRUE_FALSE"]},
        }
        keys = missing_fields or ["title", "category", "difficulty", "time_limit", "quiz_type"]
        fields = []
        seen = set()
        for key in keys:
            field = available.get(key)
            if field and field["name"] not in seen:
                fields.append(field)
                seen.add(field["name"])
        return fields or [available["title"]]
