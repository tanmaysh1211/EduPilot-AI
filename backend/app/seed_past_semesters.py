from app.database.connection import SessionLocal
from app.database.models import Student, Subject, Attendance, Marks
from datetime import datetime, timedelta
import random

db = SessionLocal()

print("Seeding Sem 1 + Sem 2 data...")

# Adjust if your student IDs differ
student1 = db.query(Student).filter(Student.roll_number == "CSE2021001").first()
student2 = db.query(Student).filter(Student.roll_number == "CSE2021002").first()

if not student1 or not student2:
    print("Could not find students. Check roll_number values match your seed_data.py.")
    db.close()
    exit()

sem1_subjects = [
    Subject(name="Chemistry", code="SEM1-CHEM", semester=1, department="CSE"),
    Subject(name="EVS", code="SEM1-EVS", semester=1, department="CSE"),
    Subject(name="Maths - I", code="SEM1-MATH1", semester=1, department="CSE"),
    Subject(name="Bio", code="SEM1-BIO", semester=1, department="CSE"),
    Subject(name="Python", code="SEM1-PY", semester=1, department="CSE"),
]

sem2_subjects = [
    Subject(name="BME", code="SEM2-BME", semester=2, department="CSE"),
    Subject(name="BE", code="SEM2-BE", semester=2, department="CSE"),
    Subject(name="Physics", code="SEM2-PHY", semester=2, department="CSE"),
    Subject(name="Maths - II", code="SEM2-MATH2", semester=2, department="CSE"),
    Subject(name="MOS", code="SEM2-MOS", semester=2, department="CSE"),
]

# Skip subjects that already exist (in case this script is re-run)
existing_codes = {s.code for s in db.query(Subject).all()}
new_subjects = [s for s in (sem1_subjects + sem2_subjects) if s.code not in existing_codes]

if new_subjects:
    db.add_all(new_subjects)
    db.commit()
    for s in new_subjects:
        db.refresh(s)
    print(f"Created {len(new_subjects)} new subjects")
else:
    print("Subjects already exist, skipping creation")

all_sem_subjects = db.query(Subject).filter(Subject.semester.in_([1, 2])).all()

exam_types = ["Internal 1", "Internal 2", "External"]
total_marks_map = {"Internal 1": 30, "Internal 2": 30, "External": 100}

for student in [student1, student2]:
    for subject in all_sem_subjects:
        # Skip if attendance already seeded for this student+subject
        already_seeded = db.query(Attendance).filter(
            Attendance.student_id == student.id,
            Attendance.subject_id == subject.id
        ).first()
        if already_seeded:
            continue

        # Past semesters: seed a full term of classes ending in the past,
        # so these show as "completed" rather than ongoing
        days_ago_start = 200 if subject.semester == 1 else 100
        for i in range(30):
            date = datetime.now() - timedelta(days=days_ago_start + i)
            is_present = random.choices([True, False], weights=[85, 15])[0]
            db.add(Attendance(
                student_id=student.id,
                subject_id=subject.id,
                date=date,
                is_present=is_present
            ))

        for exam in exam_types:
            total = total_marks_map[exam]
            obtained = random.randint(int(total * 0.55), total)
            db.add(Marks(
                student_id=student.id,
                subject_id=subject.id,
                exam_type=exam,
                marks_obtained=obtained,
                total_marks=total
            ))

db.commit()
print("Sem 1 + Sem 2 attendance and marks seeded.")
db.close()