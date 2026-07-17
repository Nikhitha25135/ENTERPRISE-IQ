from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.schemas.chat import ChatHistoryOut, ChatQueryRequest, ChatQueryResponse
from app.services import chat_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/query", response_model=ChatQueryResponse)
async def query_documents(
    payload: ChatQueryRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """Runs the query through the LangGraph multi-agent pipeline:
    Planner -> Retrieval -> (Response | Summary) -> Verification."""
    result = await chat_service.ask(
        db,
        owner_id=str(current_user["_id"]),
        query=payload.query,
        workspace_id=payload.workspace_id,
        document_id=payload.document_id,
    )
    return ChatQueryResponse(**result)


@router.get("/history", response_model=list[ChatHistoryOut])
async def chat_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    chats, _ = await chat_service.get_history(db, str(current_user["_id"]), page, page_size)
    return chats
