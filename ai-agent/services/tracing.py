from __future__ import annotations

import os
from typing import Any, Optional


def configure_tracing() -> str:
    """Configure one optional cloud exporter; local Redis trace remains always on."""
    if os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_SECRET_KEY"):
        return "langfuse"
    if os.getenv("LANGCHAIN_API_KEY"):
        os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
        os.environ.setdefault("LANGCHAIN_PROJECT", "quiz-online-ai")
        return "langsmith"
    return "local"


def create_langfuse_callback() -> Optional[Any]:
    """Enable Langfuse only when the deployment has explicit tracing credentials."""
    if not (
        os.getenv("LANGFUSE_PUBLIC_KEY")
        and os.getenv("LANGFUSE_SECRET_KEY")
    ):
        return None
    try:
        from langfuse.langchain import CallbackHandler
    except ImportError:
        return None
    return CallbackHandler()
