from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.database.connection import get_db
from app.database.models import (
    TeacherSubject, Subject, Student, Attendance, Marks, Timetable, Notification, User
)

router = APIRouter(prefix="/teacher", tags=["Teacher"])

print("========== TEACHER ROUTER LOADED ==========")
def verify_teacher_assignment(db: Session, teacher_id: int, subject_id: int, semester: int):
    """Server-side check: is this teacher actually allowed to touch this (subject, semester)?
    This is the real access-control gate — never trust the frontend alone for this."""
    assignment = db.query(TeacherSubject).filter(
        TeacherSubject.teacher_id == teacher_id,
        TeacherSubject.subject_id == subject_id,
        TeacherSubject.semester == semester
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="You are not assigned to teach this subject/semester.")


# ---------------------------------------------------------------------------
# GET /teacher/{teacher_id}/subjects — what can this teacher teach?
# ---------------------------------------------------------------------------
@router.get("/{teacher_id}/subjects")
def get_teacher_subjects(teacher_id: int, db: Session = Depends(get_db)):
    assignments = db.query(TeacherSubject).filter(TeacherSubject.teacher_id == teacher_id).all()
    result = []
    for a in assignments:
        subject = db.query(Subject).filter(Subject.id == a.subject_id).first()
        result.append({
            "subject_id": a.subject_id,
            "subject_name": subject.name if subject else "Unknown",
            "semester": a.semester,
            "credits": subject.credits if subject else None,
        })
    return {"teacher_id": teacher_id, "subjects": result}


# ---------------------------------------------------------------------------
# GET /teacher/roster/{subject_id}/{semester} — students in that class
# ---------------------------------------------------------------------------
@router.get("/roster/{subject_id}/{semester}")
def get_roster(subject_id: int, semester: int, db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.semester == semester).all()
    return {
        "subject_id": subject_id,
        "semester": semester,
        "students": [
            {"student_id": s.id, "name": s.name, "roll_number": s.roll_number}
            for s in students
        ]
    }


# ---------------------------------------------------------------------------
# POST /teacher/attendance/mark — mark attendance for a whole class on a date
# ---------------------------------------------------------------------------
class AttendanceEntry(BaseModel):
    student_id: int
    is_present: bool

class MarkAttendanceRequest(BaseModel):
    teacher_id: int
    subject_id: int
    semester: int
    date: str  # "YYYY-MM-DD"
    entries: List[AttendanceEntry]

@router.post("/attendance/mark")
def mark_attendance(request: MarkAttendanceRequest, db: Session = Depends(get_db)):
    verify_teacher_assignment(db, request.teacher_id, request.subject_id, request.semester)

    subject = db.query(Subject).filter(Subject.id == request.subject_id).first()
    class_date = datetime.strptime(request.date, "%Y-%m-%d")

    created_rows = []
    for entry in request.entries:
        # Avoid duplicate attendance for the same student/subject/date if teacher re-submits
        existing = db.query(Attendance).filter(
            Attendance.student_id == entry.student_id,
            Attendance.subject_id == request.subject_id,
            Attendance.date == class_date
        ).first()
        if existing:
            existing.is_present = entry.is_present
        else:
            row = Attendance(
                student_id=entry.student_id,
                subject_id=request.subject_id,
                date=class_date,
                is_present=entry.is_present
            )
            db.add(row)
            created_rows.append(row)

        status_text = "Present" if entry.is_present else "Absent"
        db.add(Notification(
            student_id=entry.student_id,
            type="attendance",
            message=f"Your attendance for {subject.name if subject else 'class'} on {request.date} was marked: {status_text}",
            is_read=False
        ))

    db.commit()
    return {"status": "success", "marked": len(request.entries)}


# ---------------------------------------------------------------------------
# POST /teacher/marks/enter — enter marks for a whole class for one exam
# ---------------------------------------------------------------------------
class MarksEntry(BaseModel):
    student_id: int
    marks_obtained: float

class EnterMarksRequest(BaseModel):
    teacher_id: int
    subject_id: int
    semester: int
    exam_type: str  # "Internal 1" | "Internal 2" | "External"
    total_marks: float
    entries: List[MarksEntry]

@router.post("/marks/enter")
def enter_marks(request: EnterMarksRequest, db: Session = Depends(get_db)):
    verify_teacher_assignment(db, request.teacher_id, request.subject_id, request.semester)

    subject = db.query(Subject).filter(Subject.id == request.subject_id).first()

    for entry in request.entries:
        if entry.marks_obtained > request.total_marks:
            raise HTTPException(
                status_code=400,
                detail=f"Marks for student {entry.student_id} ({entry.marks_obtained}) exceed total marks ({request.total_marks})"
            )

        existing = db.query(Marks).filter(
            Marks.student_id == entry.student_id,
            Marks.subject_id == request.subject_id,
            Marks.exam_type == request.exam_type
        ).first()
        if existing:
            existing.marks_obtained = entry.marks_obtained
            existing.total_marks = request.total_marks
        else:
            db.add(Marks(
                student_id=entry.student_id,
                subject_id=request.subject_id,
                exam_type=request.exam_type,
                marks_obtained=entry.marks_obtained,
                total_marks=request.total_marks
            ))

        db.add(Notification(
            student_id=entry.student_id,
            type="marks",
            message=f"Your {request.exam_type} marks for {subject.name if subject else 'a subject'} have been entered: {entry.marks_obtained}/{request.total_marks}",
            is_read=False
        ))

    db.commit()
    return {"status": "success", "entered": len(request.entries)}


class UpdateClassStatusRequest(BaseModel):
    teacher_id: int
    timetable_id: int
    status: str        # CLASS or NO_CLASS


@router.get("/timetable/{teacher_id}/{semester}")
def get_teacher_timetable(
    teacher_id: int,
    semester: int,
    db: Session = Depends(get_db)
):
    assignments = db.query(TeacherSubject).filter(
        TeacherSubject.teacher_id == teacher_id,
        TeacherSubject.semester == semester
    ).all()

    allowed_subjects = [a.subject_id for a in assignments]

    rows = db.query(Timetable).filter(
        Timetable.semester == semester
    ).all()

    result = []

    for row in rows:

        subject = db.query(Subject).filter(
            Subject.id == row.subject_id
        ).first()

        result.append({
            "id": row.id,
            "subject_id": row.subject_id,
            "subject": subject.name if subject else "Unknown",
            "date": row.date.strftime("%Y-%m-%d"),
            "day": row.day,
            "start_time": row.start_time,
            "end_time": row.end_time,
            "room": row.room,
            "status": row.status,
            "editable": row.subject_id in allowed_subjects
        })

    return {
        "timetable": result
    }


@router.patch("/timetable/status")
def update_class_status(
    request: UpdateClassStatusRequest,
    db: Session = Depends(get_db)
):

    timetable = db.query(Timetable).filter(
        Timetable.id == request.timetable_id
    ).first()

    if not timetable:
        raise HTTPException(
            status_code=404,
            detail="Timetable entry not found."
        )

    verify_teacher_assignment(
        db,
        request.teacher_id,
        timetable.subject_id,
        timetable.semester
    )

    subject = db.query(Subject).filter(
        Subject.id == timetable.subject_id
    ).first()

    # --------------------------
    # NO CLASS LIMIT
    # --------------------------

    if request.status == "NO_CLASS":

        count = db.query(Timetable).filter(
            Timetable.subject_id == timetable.subject_id,
            Timetable.status == "NO_CLASS"
        ).count()

        limit = 5

        if subject and subject.credits == 4:
            limit = 6

        if count >= limit:

            raise HTTPException(
                status_code=400,
                detail=f"Maximum {limit} No Class selections allowed."
            )

        students = db.query(Student).filter(
            Student.semester == timetable.semester
        ).all()

        for student in students:

            db.add(Notification(
                student_id=student.id,
                type="class_cancelled",
                message=f"{subject.name} class on {timetable.date.strftime('%d-%m-%Y')} has been cancelled.",
                is_read=False
            ))

    timetable.status = request.status

    timetable.updated_by_teacher = request.teacher_id

    timetable.updated_at = datetime.utcnow()

    db.commit()

    return {
        "status": "success"
    }




# ---------------------------------------------------------------------------
# POST /teacher/timetable/schedule — schedule one class session
# ---------------------------------------------------------------------------
# class ScheduleClassRequest(BaseModel):
#     teacher_id: int
#     subject_id: int
#     semester: int
#     date: str       # "YYYY-MM-DD"
#     start_time: str  # "HH:MM"
#     end_time: str
#     room: str

# @router.post("/timetable/schedule")
# def schedule_class(request: ScheduleClassRequest, db: Session = Depends(get_db)):
#     verify_teacher_assignment(db, request.teacher_id, request.subject_id, request.semester)

#     subject = db.query(Subject).filter(Subject.id == request.subject_id).first()
#     class_date = datetime.strptime(request.date, "%Y-%m-%d")
#     day_name = class_date.strftime("%A")

#     db.add(Timetable(
#         subject_id=request.subject_id,
#         date=class_date,
#         day=day_name,
#         start_time=request.start_time,
#         end_time=request.end_time,
#         room=request.room,
#         semester=request.semester
#     ))

#     # Notify every student in that semester
#     students = db.query(Student).filter(Student.semester == request.semester).all()
#     for s in students:
#         db.add(Notification(
#             student_id=s.id,
#             type="class_scheduled",
#             message=f"New class scheduled: {subject.name if subject else 'Class'} on {request.date} ({request.start_time}-{request.end_time}), {request.room}",
#             is_read=False
#         ))

#     db.commit()

#     # Useful for the teacher's "progress towards credit total" UI
#     total_scheduled = db.query(Timetable).filter(Timetable.subject_id == request.subject_id).count()
#     target = (subject.credits if subject and subject.credits else 3) * 12

    return {"status": "success", "total_scheduled": total_scheduled, "target": target}