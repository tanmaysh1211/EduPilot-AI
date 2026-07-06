from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Holiday

router = APIRouter(prefix="/calendar", tags=["Calendar"])

SEMESTER_BOUNDARIES = {
    3: {"start": "2026-07-01", "end": "2026-12-31"},
    2: {"start": "2026-01-01", "end": "2026-06-30"},
    1: {"start": "2025-07-01", "end": "2025-12-31"},
}


@router.get("/holidays")
def get_holidays(db: Session = Depends(get_db)):
    holidays = db.query(Holiday).all()
    return {
        "holidays": [
            {
                "date": h.date.strftime("%Y-%m-%d"),
                "label": h.label,
                "type": h.type
            }
            for h in holidays
        ]
    }


@router.get("/semester-bounds/{semester}")
def get_semester_bounds(semester: int):
    bounds = SEMESTER_BOUNDARIES.get(semester)
    if not bounds:
        return {"semester": semester, "start": None, "end": None}
    return {"semester": semester, **bounds}