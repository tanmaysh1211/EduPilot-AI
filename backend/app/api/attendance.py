# from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session
# from app.database.connection import get_db
# from app.database.models import Attendance, Student, Subject

# router = APIRouter(prefix="/attendance", tags=["Attendance"])

# @router.get("/{student_id}")
# def get_attendance(student_id: int, semester: int = Query(default=None), db: Session = Depends(get_db)):
#     student = db.query(Student).filter(Student.id == student_id).first()
#     if not student:
#         raise HTTPException(status_code=404, detail="Student not found")

#     query = db.query(Attendance).join(Subject, Attendance.subject_id == Subject.id).filter(
#         Attendance.student_id == student_id
#     )

#     if semester is not None:
#         query = query.filter(Subject.semester == semester)

#     attendance_records = query.all()

#     subject_wise = {}
#     for record in attendance_records:
#         subject = db.query(Subject).filter(Subject.id == record.subject_id).first()
#         subject_name = subject.name if subject else "Unknown"

#         if subject_name not in subject_wise:
#             subject_wise[subject_name] = {"present": 0, "total": 0}

#         subject_wise[subject_name]["total"] += 1
#         if record.is_present:
#             subject_wise[subject_name]["present"] += 1

#     result = []
#     for subject, data in subject_wise.items():
#         percentage = (data["present"] / data["total"] * 100) if data["total"] > 0 else 0
#         result.append({
#             "subject": subject,
#             "present": data["present"],
#             "total": data["total"],
#             "percentage": round(percentage, 2),
#             "status": "Safe" if percentage >= 75 else "Low"
#         })

#     return {"student_id": student_id, "semester": semester, "attendance": result}























from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Attendance, Student, Subject

router = APIRouter(prefix="/attendance", tags=["Attendance"])

@router.get("/{student_id}")
def get_attendance(student_id: int, semester: int = Query(default=None), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    query = db.query(Attendance).join(Subject, Attendance.subject_id == Subject.id).filter(
        Attendance.student_id == student_id
    )

    if semester is not None:
        query = query.filter(Subject.semester == semester)

    attendance_records = query.all()

    subject_wise = {}
    for record in attendance_records:
        subject = db.query(Subject).filter(Subject.id == record.subject_id).first()
        subject_name = subject.name if subject else "Unknown"

        if subject_name not in subject_wise:
            subject_wise[subject_name] = {
                "present": 0,
                "total": 0,
                "subject_id": subject.id if subject else None,
                "subject_code": subject.code if subject else None,
            }

        subject_wise[subject_name]["total"] += 1
        if record.is_present:
            subject_wise[subject_name]["present"] += 1

    result = []
    for subject, data in subject_wise.items():
        percentage = (data["present"] / data["total"] * 100) if data["total"] > 0 else 0
        result.append({
            "subject": subject,
            "subject_id": data["subject_id"],
            "subject_code": data["subject_code"],
            "present": data["present"],
            "total": data["total"],
            "percentage": round(percentage, 2),
            "status": "Safe" if percentage >= 75 else "Low"
        })

    return {"student_id": student_id, "semester": semester, "attendance": result}


@router.get("/{student_id}/daily/{subject_id}")
def get_daily_attendance(student_id: int, subject_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    records = db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.subject_id == subject_id
    ).order_by(Attendance.date.desc()).all()

    daily = [
        {
            "id": r.id,
            "date": r.date.strftime("%d/%m/%Y"),
            "status": "Present" if r.is_present else "Absent"
        }
        for r in records
    ]

    return {
        "student_id": student_id,
        "subject_id": subject_id,
        "subject_name": subject.name,
        "subject_code": subject.code,
        "daily": daily
    }