"""
Thin wrapper around the Groq chat completions API.

Kept as one function so every agent node calls the LLM the same way, and so
swapping providers later (or adding retries/timeouts) only means editing
this one file.
"""
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client = None


def _get_client():
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to your .env file to enable "
                "the agent layer (Planner/Summary/Response nodes all call Groq)."
            )
        from groq import Groq

        _client = Groq(api_key=settings.groq_api_key)
    return _client


def chat_completion(messages: list[dict], temperature: float = 0.2, max_tokens: int = 1024) -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()
