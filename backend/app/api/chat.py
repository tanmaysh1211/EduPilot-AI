# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.database.connection import get_db
# from app.services.ai_service import chat_with_ai
# from pydantic import BaseModel

# router = APIRouter(prefix="/chat", tags=["AI Chat"])

# class ChatRequest(BaseModel):
#     question: str
#     student_id: int

# @router.post("/")
# def chat(request: ChatRequest, db: Session = Depends(get_db)):
#     result = chat_with_ai(db, request.question, request.student_id)
#     return result







# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from app.database.connection import get_db
# from app.services.ai_service import chat_with_ai
# from pydantic import BaseModel
# from typing import Optional, List

# router = APIRouter(prefix="/chat", tags=["AI Chat"])

# class HistoryItem(BaseModel):
#     role: str  # "user" | "assistant"
#     content: str

# class ChatRequest(BaseModel):
#     question: str
#     student_id: int
#     history: Optional[List[HistoryItem]] = None

# @router.post("/")
# def chat(request: ChatRequest, db: Session = Depends(get_db)):
#     history = [h.dict() for h in request.history] if request.history else []
#     result = chat_with_ai(db, request.question, request.student_id, history)
#     return result













# from fastapi import APIRouter, Depends
# from fastapi.responses import StreamingResponse
# from sqlalchemy.orm import Session
# from app.database.connection import get_db
# from app.services.ai_service import chat_with_ai, chat_with_ai_stream
# from pydantic import BaseModel
# from typing import Optional, List
# import json

# router = APIRouter(prefix="/chat", tags=["AI Chat"])

# class HistoryItem(BaseModel):
#     role: str  # "user" | "assistant"
#     content: str

# class ChatRequest(BaseModel):
#     question: str
#     student_id: int
#     history: Optional[List[HistoryItem]] = None

# @router.post("/")
# def chat(request: ChatRequest, db: Session = Depends(get_db)):
#     """Non-streaming endpoint — kept for backwards compatibility / simple clients."""
#     history = [h.dict() for h in request.history] if request.history else []
#     result = chat_with_ai(db, request.question, request.student_id, history)
#     return result


# @router.post("/stream")
# def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
#     """
#     Server-Sent Events streaming endpoint.
#     Sends a `meta` event first (intent/sql/data), then a stream of `token`
#     events as the answer is generated, then a final `done` event.
#     """
#     history = [h.dict() for h in request.history] if request.history else []

#     def event_generator():
#         for chunk in chat_with_ai_stream(db, request.question, request.student_id, history):
#             yield f"data: {json.dumps(chunk)}\n\n"

#     return StreamingResponse(event_generator(), media_type="text/event-stream")


















from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.ai_service import chat_with_ai, chat_with_ai_stream
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import json

router = APIRouter(prefix="/chat", tags=["AI Chat"])

class HistoryItem(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    question: str
    student_id: int
    history: Optional[List[HistoryItem]] = None


class DateTimeEncoder(json.JSONEncoder):
    """Handles datetime/date objects that come back from raw SQL query results,
    which the default json.dumps() can't serialize on its own."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


@router.post("/")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Non-streaming endpoint — kept for backwards compatibility / simple clients."""
    history = [h.dict() for h in request.history] if request.history else []
    result = chat_with_ai(db, request.question, request.student_id, history)
    return result


@router.post("/stream")
def chat_stream(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Server-Sent Events streaming endpoint.
    Sends a `meta` event first (intent/sql/data), then a stream of `token`
    events as the answer is generated, then a final `done` event.
    """
    history = [h.dict() for h in request.history] if request.history else []

    def event_generator():
        for chunk in chat_with_ai_stream(db, request.question, request.student_id, history):
            yield f"data: {json.dumps(chunk, cls=DateTimeEncoder)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")