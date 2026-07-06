# from fastapi import APIRouter, Depends, HTTPException, Query
# from sqlalchemy.orm import Session
# from app.database.connection import get_db
# from app.database.models import Marks, Student, Subject

# router = APIRouter(prefix="/marks", tags=["Marks"])

# @router.get("/{student_id}")
# def get_marks(student_id: int, semester: int = Query(default=None), db: Session = Depends(get_db)):
#     student = db.query(Student).filter(Student.id == student_id).first()
#     if not student:
#         raise HTTPException(status_code=404, detail="Student not found")

#     query = db.query(Marks).join(Subject, Marks.subject_id == Subject.id).filter(
#         Marks.student_id == student_id
#     )

#     if semester is not None:
#         query = query.filter(Subject.semester == semester)

#     marks_records = query.all()

#     result = []
#     for record in marks_records:
#         subject = db.query(Subject).filter(Subject.id == record.subject_id).first()
#         result.append({
#             "subject": subject.name if subject else "Unknown",
#             "exam_type": record.exam_type,
#             "marks_obtained": record.marks_obtained,
#             "total_marks": record.total_marks,
#             "percentage": round((record.marks_obtained / record.total_marks) * 100, 2)
#         })

#     return {"student_id": student_id, "semester": semester, "marks": result}















from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import Marks, Student, Subject

router = APIRouter(prefix="/marks", tags=["Marks"])

EXAM_WEIGHTS = {"Internal 1": 30, "Internal 2": 30, "External": 100}


def percentage_to_grade(pct: float):
    if pct >= 90: return "O", 10
    if pct >= 80: return "A+", 9
    if pct >= 70: return "A", 8
    if pct >= 60: return "B+", 7
    if pct >= 50: return "B", 6
    if pct >= 40: return "C", 5
    return "F", 0


@router.get("/{student_id}")
def get_marks(student_id: int, semester: int = Query(default=None), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    query = db.query(Marks).join(Subject, Marks.subject_id == Subject.id).filter(
        Marks.student_id == student_id
    )
    if semester is not None:
        query = query.filter(Subject.semester == semester)
    marks_records = query.all()

    result = []
    for record in marks_records:
        subject = db.query(Subject).filter(Subject.id == record.subject_id).first()
        result.append({
             "id": record.id,
            "subject": subject.name if subject else "Unknown",
            "subject_id": record.subject_id,
            "exam_type": record.exam_type,
            "marks_obtained": record.marks_obtained,
            "total_marks": record.total_marks,
            "percentage": round((record.marks_obtained / record.total_marks) * 100, 2)
        })

    return {"student_id": student_id, "semester": semester, "marks": result}


@router.get("/{student_id}/class-average")
def get_class_average(student_id: int, semester: int = Query(...), db: Session = Depends(get_db)):
    """Average marks per subject+exam_type across ALL students in that semester."""
    subject_ids = [s.id for s in db.query(Subject).filter(Subject.semester == semester).all()]
    if not subject_ids:
        return {"semester": semester, "averages": []}

    all_marks = db.query(Marks).filter(Marks.subject_id.in_(subject_ids)).all()

    buckets = {}
    for m in all_marks:
        key = (m.subject_id, m.exam_type)
        if key not in buckets:
            buckets[key] = []
        buckets[key].append(m.marks_obtained)

    averages = []
    for (subject_id, exam_type), values in buckets.items():
        averages.append({
            "subject_id": subject_id,
            "exam_type": exam_type,
            "class_average": round(sum(values) / len(values), 2),
            "student_count": len(values)
        })

    return {"semester": semester, "averages": averages}


@router.get("/{student_id}/gpa")
def get_gpa(student_id: int, db: Session = Depends(get_db)):
    """SGPA per semester (1, 2, 3...) plus overall CGPA across all of them."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    all_marks = db.query(Marks).join(Subject, Marks.subject_id == Subject.id).filter(
        Marks.student_id == student_id
    ).all()

    subject_semester = {}
    subject_marks = {}
    for m in all_marks:
        subject = db.query(Subject).filter(Subject.id == m.subject_id).first()
        if not subject:
            continue
        subject_semester[m.subject_id] = subject.semester
        subject_marks.setdefault(m.subject_id, {})[m.exam_type] = m

    subject_grades = {}
    for subject_id, exams in subject_marks.items():
        obtained_total = sum(e.marks_obtained for e in exams.values())
        max_total = sum(EXAM_WEIGHTS.get(e.exam_type, e.total_marks) for e in exams.values())
        if max_total == 0:
            continue
        pct = (obtained_total / max_total) * 100
        grade, grade_point = percentage_to_grade(pct)
        subject_grades[subject_id] = {
            "semester": subject_semester[subject_id],
            "percentage": round(pct, 2),
            "grade": grade,
            "grade_point": grade_point
        }

    semesters = {}
    for subject_id, data in subject_grades.items():
        sem = data["semester"]
        semesters.setdefault(sem, []).append(data["grade_point"])

    sgpa_by_semester = {
        sem: round(sum(points) / len(points), 2)
        for sem, points in semesters.items()
    }

    cgpa = round(sum(sgpa_by_semester.values()) / len(sgpa_by_semester), 2) if sgpa_by_semester else 0

    return {
        "student_id": student_id,
        "subject_grades": subject_grades,
        "sgpa_by_semester": sgpa_by_semester,
        "cgpa": cgpa
    }