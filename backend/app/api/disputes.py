from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.database.connection import get_db
from app.database.models import Dispute, Student, TeacherSubject, Subject, Notification, Attendance, Marks

router = APIRouter(prefix="/disputes", tags=["Disputes"])


class RaiseDisputeRequest(BaseModel):
    student_id: int
    subject_id: int
    type: str          # "attendance" | "marks"
    related_id: int    # the Attendance.id or Marks.id being disputed
    student_message: str


@router.post("/")
def raise_dispute(request: RaiseDisputeRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Find which teacher is assigned to this subject for this student's semester
    assignment = db.query(TeacherSubject).filter(
        TeacherSubject.subject_id == request.subject_id,
        TeacherSubject.semester == student.semester
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="No teacher found for this subject/semester")

    dispute = Dispute(
        student_id=request.student_id,
        teacher_id=assignment.teacher_id,
        type=request.type,
        related_id=request.related_id,
        student_message=request.student_message,
        status="open"
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)
    return {"status": "success", "dispute_id": dispute.id}


@router.get("/teacher/{teacher_id}")
def get_teacher_disputes(teacher_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Dispute).filter(Dispute.teacher_id == teacher_id)
    if status:
        query = query.filter(Dispute.status == status)
    disputes = query.order_by(Dispute.created_at.desc()).all()

    result = []
    for d in disputes:
        student = db.query(Student).filter(Student.id == d.student_id).first()
        # Pull the actual disputed record so the teacher can see what's being questioned
        related_detail = None
        if d.type == "attendance":
            row = db.query(Attendance).filter(Attendance.id == d.related_id).first()
            if row:
                related_detail = {"date": row.date.strftime("%Y-%m-%d"), "is_present": row.is_present}
        elif d.type == "marks":
            row = db.query(Marks).filter(Marks.id == d.related_id).first()
            if row:
                related_detail = {"exam_type": row.exam_type, "marks_obtained": row.marks_obtained, "total_marks": row.total_marks}

        result.append({
            "id": d.id,
            "student_name": student.name if student else "Unknown",
            "type": d.type,
            "related_id": d.related_id,
            "related_detail": related_detail,
            "student_message": d.student_message,
            "status": d.status,
            "teacher_response": d.teacher_response,
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M") if d.created_at else None
        })
    return {"disputes": result}


class ResolveDisputeRequest(BaseModel):
    teacher_response: str
    corrected_value: Optional[dict] = None
    # For attendance: {"is_present": true/false}
    # For marks: {"marks_obtained": 25}


@router.post("/{dispute_id}/resolve")
def resolve_dispute(dispute_id: int, request: ResolveDisputeRequest, db: Session = Depends(get_db)):
    dispute = db.query(Dispute).filter(Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    if request.corrected_value:
        if dispute.type == "attendance":
            row = db.query(Attendance).filter(Attendance.id == dispute.related_id).first()
            if row and "is_present" in request.corrected_value:
                row.is_present = request.corrected_value["is_present"]
        elif dispute.type == "marks":
            row = db.query(Marks).filter(Marks.id == dispute.related_id).first()
            if row and "marks_obtained" in request.corrected_value:
                row.marks_obtained = request.corrected_value["marks_obtained"]

    dispute.status = "resolved"
    dispute.teacher_response = request.teacher_response
    dispute.resolved_at = datetime.utcnow()

    db.add(Notification(
        student_id=dispute.student_id,
        type="query_response",
        message=f"Your query has been resolved: {request.teacher_response}",
        is_read=False
    ))

    db.commit()
    return {"status": "success"}