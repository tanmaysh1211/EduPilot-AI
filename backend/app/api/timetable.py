from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
# from app.database.models import Timetable, Subject
from app.database.models import (Timetable,Subject)

router = APIRouter(prefix="/timetable", tags=["Timetable"])

@router.get("/{semester}")
def get_timetable(semester: int, db: Session = Depends(get_db)):
    records = db.query(Timetable).filter(Timetable.semester == semester).all()

    result = []
    for record in records:
        subject = db.query(Subject).filter(Subject.id == record.subject_id).first()
        # result.append({
        #     "subject": subject.name if subject else "Unknown",
        #     "date": record.date.strftime("%Y-%m-%d") if record.date else None,
        #     "day": record.day,
        #     "start_time": record.start_time,
        #     "end_time": record.end_time,
        #     "room": record.room
        # })

        result.append({
                "id": record.id,
                "subject_id": record.subject_id,
                "subject": {
                    "id": subject.id if subject else None,
                    "name": subject.name if subject else "Unknown",
                    "credits": subject.credits if subject else 3
                },
                "date": record.date.strftime("%Y-%m-%d") if record.date else None,
                "day": record.day,
                "start_time": record.start_time,
                "end_time": record.end_time,
                "room": record.room,
                # NEW
                "status": record.status
            })

    return {"semester": semester, "timetable": result}