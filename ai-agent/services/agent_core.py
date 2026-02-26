import os
import json
from typing import List, Dict, Any, Literal
from .tools import MCPToolWrapper
# Depending on requirements, we can use openai or anthropic libraries. 
# For now, I'll structure it to be generic or assume a standard interface.

class AIAgentCore:
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.tools = MCPToolWrapper(self.config)
        self.conversation_history = []
        # In a real app, you might initialize the LLM client here
        # self.llm = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def process_message(self, user_input: str, user_id: str = "default") -> str:
        """
        Main entry point for processing a user message.
        """
        self.conversation_history.append({"role": "user", "content": user_input})
        
        # 1. Intent Classification
        intent = await self._classify_intent(user_input)
        print(f"[Agent] Detected Intent: {intent}")

        response = ""
        
        # 2. Route based on intent
        if intent == "query":
            response = await self._handle_query_intent(user_input)
        elif intent == "action":
            response = await self._handle_action_intent(user_input)
        else:
            # Fallback / Chat
            response = await self._handle_chat_intent(user_input)

        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    async def _classify_intent(self, text: str) -> Literal["query", "action", "chat"]:
        """
        Determines if the user wants to query data, perform an action, or just chat.
        This should essentially use an LLM call.
        """
        # TODO: Replace with actual LLM call
        text_lower = text.lower()
        if any(word in text_lower for word in ["mấy giờ", "bao nhiêu", "danh sách", "liệt kê", "tìm", "xem"]):
            return "query"
        elif any(word in text_lower for word in ["thêm", "sửa", "xóa", "tạo", "mua", "đặt"]):
            return "action"
        return "chat"

    async def _handle_query_intent(self, text: str) -> str:
        """
        Handles data retrieval logic:
        1. Extract keywords
        2. Search metadata
        3. Generate SQL
        4. Execute SQL
        5. Format response
        """
        # 1. Mock keyword extraction
        keywords = text.split() 
        
        # 2. Get metadata
        metadata = await self.tools.search_metadata(keywords)
        
        # 3. Simulate SQL Generation (in reality, pass metadata + question to LLM)
        sql_query = "SELECT SUM(revenue) FROM orders" # Mocked
        
        # 4. Execute SQL
        result = await self.tools.execute_sql(sql_query)
        
        # 5. Format response (Simulate LLM formatting)
        return f"Dựa trên dữ liệu, kết quả là: {result}"

    async def _handle_action_intent(self, text: str) -> str:
        """
        Handles action execution logic:
        1. Extract parameters
        2. Identify API endpoint
        3. Call Backend API
        4. Return result
        """
        # Mock parameter extraction
        # In reality: Response = LLM.generate(tools=[api_definitions], prompt=text)
        
        # Mock API call
        result = await self.tools.call_backend_api("POST", "/api/mock", {"raw_text": text})
        
        return f"Đã thực hiện thao tác thành công. Chi tiết: {result['message']}"

    async def _handle_chat_intent(self, text: str) -> str:
        """
        Handles general conversation.
        """
        # TODO: Call LLM for chat
        return "Tôi là AI Agent hỗ trợ quản lý hệ thống. Bạn cần giúp gì về tra cứu dữ liệu hoặc thao tác hệ thống?"
