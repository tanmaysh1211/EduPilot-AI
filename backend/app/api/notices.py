from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.connection import get_db
from app.database.models import Notice

router = APIRouter(prefix="/notices", tags=["Notices"])

@router.get("/")
def get_notices(category: str = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Notice).order_by(Notice.created_at.desc())
    if category:
        query = query.filter(Notice.category == category)
    notices = query.all()

    return {
        "notices": [
            {
                "id": n.id,
                "title": n.title,
                "content": n.content,
                "category": n.category,
                "created_at": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else None
            }
            for n in notices
        ]
    }


class CreateNoticeRequest(BaseModel):
    title: str
    content: str
    category: str
 
@router.post("/")
def create_notice(request: CreateNoticeRequest, db: Session = Depends(get_db)):
    notice = Notice(title=request.title, content=request.content, category=request.category)
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return {"status": "success", "notice_id": notice.id}