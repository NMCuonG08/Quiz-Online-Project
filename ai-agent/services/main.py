from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .agent_core import AIAgentCore
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv(dotenv_path="../config/.env")

app = FastAPI(title="AI Agent Service")

# Initialize Core
# In a production app, you might want to load config from a file or env vars properly
agent = AIAgentCore(config={
    "openai_api_key": os.getenv("OPENAI_API_KEY"),
    "backend_url": os.getenv("BACKEND_URL")
})

class ChatRequest(BaseModel):
    message: str
    user_id: str = "default_user"

class ChatResponse(BaseModel):
    response: str

@app.get("/")
async def root():
    return {"status": "AI Agent Service is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        response_text = await agent.process_message(request.message, request.user_id)
        return ChatResponse(response=response_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
