from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Student, User

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/{student_id}")
def get_profile(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    user = db.query(User).filter(User.id == student.user_id).first()

    return {
        "id": student.id,
        "name": student.name,
        "roll_number": student.roll_number,
        "department": student.department,
        "semester": student.semester,
        "email": user.email if user else None,
        "role": user.role if user else None,
    }