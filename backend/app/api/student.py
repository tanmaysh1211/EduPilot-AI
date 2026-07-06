from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Student
from pydantic import BaseModel

router = APIRouter(prefix="/students", tags=["Students"])

class StudentCreate(BaseModel):
    user_id: int
    name: str
    roll_number: str
    department: str
    semester: int

@router.post("/")
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(Student).filter(Student.roll_number == data.roll_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Roll number already exists")
    student = Student(**data.dict())
    db.add(student)
    db.commit()
    db.refresh(student)
    return {"message": "Student created", "student_id": student.id}

@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student