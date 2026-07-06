from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database.connection import get_db
from app.database.models import Notice, Notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/{student_id}")
def get_notifications(student_id: int, unread_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Notification).filter(Notification.student_id == student_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    notifications = query.order_by(Notification.created_at.desc()).all()

    return {
        "student_id": student_id,
        "unread_count": db.query(Notification).filter(
            Notification.student_id == student_id, Notification.is_read == False
        ).count(),
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "related_id": n.related_id,
                "is_read": n.is_read,
                "created_at": n.created_at.strftime("%Y-%m-%d %H:%M") if n.created_at else None
            }
            for n in notifications
        ]
    }


@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"status": "success"}


@router.post("/{student_id}/read-all")
def mark_all_read(student_id: int, db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.student_id == student_id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}