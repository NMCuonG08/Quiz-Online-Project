from __future__ import annotations

from typing import Any, Dict, Optional

import httpx


class MCPToolWrapper:
    """Authenticated gateway from model tools to the existing NestJS API."""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.backend_url = (self.config.get("backend_url") or "http://localhost:3333").rstrip("/")

    async def call_backend_api(
        self,
        method: str,
        endpoint: str,
        body: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        authorization: Optional[str] = None,
    ) -> Dict[str, Any]:
        headers: Dict[str, str] = {"Accept": "application/json"}
        if authorization:
            headers["Authorization"] = authorization
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method=method,
                url=f"{self.backend_url}{endpoint}",
                json=body if method.upper() not in {"GET", "HEAD"} else None,
                params=params,
                headers=headers,
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    def data(response: Dict[str, Any]) -> Any:
        return response.get("data", response)

    @classmethod
    def compact(cls, response: Dict[str, Any], limit: int = 20) -> Any:
        payload = cls.data(response)
        if isinstance(payload, dict) and isinstance(payload.get("items"), list):
            return {**payload, "items": payload["items"][:limit]}
        if isinstance(payload, dict) and isinstance(payload.get("data"), list):
            return {**payload, "data": payload["data"][:limit]}
        if isinstance(payload, list):
            return payload[:limit]
        return payload

    @classmethod
    def quiz_citations(cls, payload: Any, limit: int = 10) -> list[dict[str, str]]:
        """Turn real public quiz records into UI-safe, navigable evidence."""
        if isinstance(payload, dict):
            items = payload.get("items", payload.get("data", [payload]))
        elif isinstance(payload, list):
            items = payload
        else:
            items = []
        if not isinstance(items, list):
            items = [items]

        citations: list[dict[str, str]] = []
        for item in items[:limit]:
            if not isinstance(item, dict) or not item.get("slug"):
                continue
            title = str(item.get("title") or item["slug"])
            description = str(item.get("description") or item.get("instructions") or "")
            citations.append({
                "title": title,
                "url": f"/quiz/{item['slug']}",
                "snippet": description[:800],
            })
        return citations

    async def search_quizzes(self, query: str, limit: int = 10) -> Any:
        response = await self.call_backend_api(
            "GET", "/api/quizzes/search", params={"search": query, "page": 1, "limit": limit}
        )
        return self.compact(response, limit)

    async def recommend_quizzes(self, limit: int = 10) -> Any:
        response = await self.call_backend_api(
            "GET", "/api/quizzes/popular", params={"page": 1, "limit": limit},
        )
        return self.compact(response, limit)

    async def search_quizzes_with_citations(
        self, query: str, limit: int = 10
    ) -> tuple[Any, list[dict[str, str]]]:
        result = await self.search_quizzes(query, limit)
        return result, self.quiz_citations(result, limit)

    @staticmethod
    def knowledge_citations(payload: Any, limit: int = 10) -> list[dict[str, str]]:
        items = payload if isinstance(payload, list) else []
        citations: list[dict[str, str]] = []
        for item in items[:limit]:
            if not isinstance(item, dict) or not item.get("source_title"):
                continue
            citations.append({
                "title": str(item["source_title"]),
                "url": str(item.get("source_uri") or ""),
                "snippet": str(item.get("content") or "")[:800],
            })
        return citations

    async def search_knowledge(
        self, query: str, limit: int = 5
    ) -> tuple[Any, list[dict[str, str]]]:
        response = await self.call_backend_api(
            "GET", "/api/knowledge/search", params={"query": query, "limit": limit}
        )
        result = self.data(response)
        return result, self.knowledge_citations(result, limit)

    async def get_my_quizzes(self, authorization: str, limit: int = 10) -> Any:
        response = await self.call_backend_api(
            "GET", "/api/quizzes/me", params={"page": 1, "limit": limit}, authorization=authorization
        )
        return self.compact(response, limit)

    async def get_quiz(self, quiz_id: str = "", slug: str = "") -> Any:
        endpoint = f"/api/quizzes/id/{quiz_id}" if quiz_id else f"/api/quizzes/slug/{slug}"
        return self.data(await self.call_backend_api("GET", endpoint))

    async def get_quiz_with_citation(
        self, quiz_id: str = "", slug: str = ""
    ) -> tuple[Any, list[dict[str, str]]]:
        result = await self.get_quiz(quiz_id, slug)
        return result, self.quiz_citations(result, 1)

    async def list_categories(self) -> Any:
        return self.compact(await self.call_backend_api("GET", "/api/categories"), 100)

    async def get_current_user(self, authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "GET", "/api/auth/me", authorization=authorization,
        ))

    async def get_my_permissions(self, authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "GET", "/api/auth/me/permissions", authorization=authorization,
        ))

    async def append_chat_history(
        self, session_id: str, scope: str, messages: list[dict[str, Any]], authorization: str
    ) -> Any:
        return self.data(await self.call_backend_api(
            "POST", f"/api/ai-chat/conversations/{session_id}/messages",
            body={"scope": scope, "messages": messages}, authorization=authorization,
        ))

    async def create_category(self, payload: Dict[str, Any], authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "POST", "/api/categories", body=payload, authorization=authorization,
        ))

    async def update_category(
        self, category_id: str, changes: Dict[str, Any], authorization: str
    ) -> Any:
        return self.data(await self.call_backend_api(
            "PATCH", f"/api/categories/{category_id}", body=changes, authorization=authorization,
        ))

    async def delete_category(self, category_id: str, authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "DELETE", f"/api/categories/{category_id}", authorization=authorization,
        ))

    async def create_quiz(self, payload: Dict[str, Any], authorization: str) -> Any:
        return self.data(await self.call_backend_api("POST", "/api/quizzes", body=payload, authorization=authorization))

    async def update_quiz(self, quiz_id: str, changes: Dict[str, Any], authorization: str) -> Any:
        return self.data(
            await self.call_backend_api("PATCH", f"/api/quizzes/{quiz_id}", body=changes, authorization=authorization)
        )

    async def delete_quiz(self, quiz_id: str, authorization: str) -> Any:
        return self.data(await self.call_backend_api("DELETE", f"/api/quizzes/{quiz_id}", authorization=authorization))

    async def start_quiz(self, quiz_id: str, quiz_slug: str, authorization: str) -> Any:
        payload = {"quiz_id": quiz_id} if quiz_id else {"quiz_slug": quiz_slug}
        return self.data(
            await self.call_backend_api("POST", "/api/quiz-sessions", body=payload, authorization=authorization)
        )

    async def list_questions(self, quiz_id: str, authorization: str) -> Any:
        await self._ensure_owned_quiz(quiz_id, authorization)
        response = await self.call_backend_api(
            "GET", f"/api/questions/quiz/{quiz_id}/all", authorization=authorization
        )
        return self.compact(response, 100)

    async def get_quiz_build_status(self, quiz_id: str, authorization: str) -> Any:
        quiz = await self.get_quiz(quiz_id=quiz_id)
        questions_payload = await self.list_questions(quiz_id, authorization)
        if isinstance(questions_payload, dict):
            questions = questions_payload.get("items", questions_payload.get("data", []))
        else:
            questions = questions_payload
        questions = questions if isinstance(questions, list) else []
        total_points = sum(float(item.get("points") or 0) for item in questions if isinstance(item, dict))
        issues: list[str] = []
        if not questions:
            issues.append("Quiz chưa có câu hỏi")
        for index, question in enumerate(questions, start=1):
            if not isinstance(question, dict):
                issues.append(f"Câu hỏi {index} có dữ liệu không hợp lệ")
                continue
            if not str(question.get("question_text") or "").strip():
                issues.append(f"Câu hỏi {index} thiếu nội dung")
            question_type = str(question.get("question_type") or "")
            if question_type in {"SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"}:
                options = question.get("options") or []
                if not isinstance(options, list) or len(options) < 2:
                    issues.append(f"Câu hỏi {index} cần ít nhất 2 đáp án")
                    continue
                correct_count = sum(
                    1 for option in options
                    if isinstance(option, dict) and option.get("is_correct") is True
                )
                if question_type in {"SINGLE_CHOICE", "TRUE_FALSE"} and correct_count != 1:
                    issues.append(f"Câu hỏi {index} cần đúng 1 đáp án đúng")
                if question_type == "MULTIPLE_CHOICE" and correct_count < 1:
                    issues.append(f"Câu hỏi {index} cần ít nhất 1 đáp án đúng")
        return {
            "quiz": quiz,
            "question_count": len(questions),
            "total_points": total_points,
            "ready_to_publish": not issues,
            "issues": issues,
        }

    async def create_question(self, payload: Dict[str, Any], authorization: str) -> Any:
        await self._ensure_owned_quiz(payload["quiz_id"], authorization)
        return self.data(
            await self.call_backend_api("POST", "/api/questions", body=payload, authorization=authorization)
        )

    async def update_question(self, question_id: str, changes: Dict[str, Any], authorization: str) -> Any:
        await self._ensure_owned_question(question_id, authorization)
        return self.data(
            await self.call_backend_api(
                "PATCH", f"/api/questions/{question_id}", body=changes, authorization=authorization
            )
        )

    async def delete_question(self, question_id: str, authorization: str) -> Any:
        await self._ensure_owned_question(question_id, authorization)
        return self.data(
            await self.call_backend_api("DELETE", f"/api/questions/{question_id}", authorization=authorization)
        )

    async def duplicate_question(
        self, question_id: str, new_quiz_id: str, authorization: str
    ) -> Any:
        await self._ensure_owned_question(question_id, authorization)
        if new_quiz_id:
            await self._ensure_owned_quiz(new_quiz_id, authorization)
        return self.data(await self.call_backend_api(
            "POST", f"/api/questions/{question_id}/duplicate",
            body={"newQuizId": new_quiz_id} if new_quiz_id else {},
            authorization=authorization,
        ))

    async def reorder_questions(
        self, quiz_id: str, question_orders: list[dict[str, Any]], authorization: str
    ) -> Any:
        await self._ensure_owned_quiz(quiz_id, authorization)
        return self.data(await self.call_backend_api(
            "PATCH", f"/api/questions/quiz/{quiz_id}/reorder",
            body={"questionOrders": question_orders}, authorization=authorization,
        ))

    async def get_quiz_history(self, authorization: str, limit: int = 10) -> Any:
        response = await self.call_backend_api(
            "GET",
            "/api/quiz-sessions/user/history",
            params={"page": 1, "limit": limit},
            authorization=authorization,
        )
        return self.compact(response, limit)

    async def get_in_progress_quizzes(self, authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "GET", "/api/quiz-sessions/user/in-progress", authorization=authorization,
        ))

    async def get_all_attempts(self, authorization: str, limit: int = 20) -> Any:
        response = await self.call_backend_api(
            "GET", "/api/quiz-sessions/user/all-attempts",
            params={"page": 1, "limit": limit}, authorization=authorization,
        )
        return self.compact(response, limit)

    async def get_quiz_result(self, session_id: str, authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "GET", f"/api/quiz-sessions/{session_id}/result", authorization=authorization,
        ))

    async def list_knowledge_sources(self, authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "GET", "/api/knowledge/sources", authorization=authorization,
        ))

    async def import_knowledge_url(
        self, url: str, title: str, visibility: str, authorization: str
    ) -> Any:
        payload = {"url": url, "visibility": visibility}
        if title:
            payload["title"] = title
        return self.data(await self.call_backend_api(
            "POST", "/api/knowledge/sources/import-url", body=payload, authorization=authorization,
        ))

    async def submit_knowledge_review(self, source_id: str, authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "POST", f"/api/knowledge/sources/{source_id}/submit", authorization=authorization,
        ))

    async def review_knowledge(
        self, source_id: str, status: str, rejection_reason: str, authorization: str
    ) -> Any:
        payload = {"status": status}
        if rejection_reason:
            payload["rejection_reason"] = rejection_reason
        return self.data(await self.call_backend_api(
            "POST", f"/api/knowledge/sources/{source_id}/review",
            body=payload, authorization=authorization,
        ))

    async def get_admin_dashboard_stats(self, authorization: str) -> Any:
        return self.data(await self.call_backend_api(
            "GET", "/api/admin/dashboard/stats", authorization=authorization,
        ))

    async def list_audit_events(
        self, authorization: str, limit: int = 50, action: str = "", resource_type: str = ""
    ) -> Any:
        return self.data(await self.call_backend_api(
            "GET", "/api/admin/audit-events",
            params={
                "limit": limit,
                **({"action": action} if action else {}),
                **({"resource_type": resource_type} if resource_type else {}),
            },
            authorization=authorization,
        ))

    async def _ensure_owned_quiz(self, quiz_id: str, authorization: str) -> None:
        response = await self.call_backend_api(
            "GET", "/api/quizzes/me", params={"page": 1, "limit": 1000}, authorization=authorization
        )
        payload = self.data(response)
        items = payload.get("items", []) if isinstance(payload, dict) else []
        if not any(str(item.get("id")) == str(quiz_id) for item in items):
            raise PermissionError("Quiz không thuộc người dùng hiện tại")

    async def _ensure_owned_question(self, question_id: str, authorization: str) -> None:
        question = self.data(
            await self.call_backend_api("GET", f"/api/questions/{question_id}", authorization=authorization)
        )
        quiz_id = question.get("quiz_id") if isinstance(question, dict) else None
        if not quiz_id:
            raise ValueError("Không xác định được quiz của câu hỏi")
        await self._ensure_owned_quiz(str(quiz_id), authorization)
