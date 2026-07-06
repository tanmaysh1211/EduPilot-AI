from app.database.connection import SessionLocal
from app.database.models import User, Student, Subject, Attendance, Marks, Timetable, Notice
from app.services.auth_service import hash_password
from datetime import datetime, timedelta
import random

db = SessionLocal()

print("🌱 Seeding database...")

# 1. Users
user1 = User(email="rohit.student@EduPilot.com", hashed_password=hash_password("rohit123"), role="student")
user2 = User(email="priya.student@EduPilot.com", hashed_password=hash_password("priya123"), role="student")
db.add_all([user1, user2])
db.commit()
db.refresh(user1)
db.refresh(user2)
print("✅ Users created")

# 2. Subjects
subjects = [
    Subject(name="Data Structures", code="CS301", semester=3, department="CSE"),
    Subject(name="DBMS", code="CS302", semester=3, department="CSE"),
    Subject(name="Operating Systems", code="CS303", semester=3, department="CSE"),
    Subject(name="Computer Networks", code="CS304", semester=3, department="CSE"),
    Subject(name="Web Technologies", code="CS305", semester=3, department="CSE"),
]
db.add_all(subjects)
db.commit()
for s in subjects:
    db.refresh(s)
print("✅ Subjects created")

# 3. Students
student1 = Student(user_id=user1.id, name="Rohit Kumar", roll_number="CSE2021001", department="CSE", semester=3)
student2 = Student(user_id=user2.id, name="Priya Sharma", roll_number="CSE2021002", department="CSE", semester=3)
db.add_all([student1, student2])
db.commit()
db.refresh(student1)
db.refresh(student2)
print("✅ Students created")

# 4. Attendance
for student in [student1, student2]:
    for subject in subjects:
        for i in range(20):
            date = datetime.now() - timedelta(days=i)
            is_present = random.choices([True, False], weights=[80, 20])[0]
            att = Attendance(
                student_id=student.id,
                subject_id=subject.id,
                date=date,
                is_present=is_present
            )
            db.add(att)
db.commit()
print("✅ Attendance created")

# 5. Marks
exam_types = ["Internal 1", "Internal 2", "External"]
total_marks_map = {"Internal 1": 30, "Internal 2": 30, "External": 100}

for student in [student1, student2]:
    for subject in subjects:
        for exam in exam_types:
            total = total_marks_map[exam]
            obtained = random.randint(int(total * 0.5), total)
            mark = Marks(
                student_id=student.id,
                subject_id=subject.id,
                exam_type=exam,
                marks_obtained=obtained,
                total_marks=total
            )
            db.add(mark)
db.commit()
print("✅ Marks created")

# 6. Timetable
days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
times = [("09:00", "10:00"), ("10:00", "11:00"), ("11:00", "12:00"), ("14:00", "15:00"), ("15:00", "16:00")]
rooms = ["Room 101", "Room 102", "Lab 1", "Room 201", "Room 202"]

for i, subject in enumerate(subjects):
    tt = Timetable(
        subject_id=subject.id,
        day=days[i],
        start_time=times[i][0],
        end_time=times[i][1],
        room=rooms[i],
        semester=3
    )
    db.add(tt)
db.commit()
print("✅ Timetable created")

# 7. Notices
notices = [
    Notice(title="Exam Schedule Released", content="End semester exams will begin from July 15, 2026. Students are advised to check their hall tickets.", category="Exam"),
    Notice(title="Holiday Notice", content="College will remain closed on June 20, 2026 on account of a national holiday.", category="Holiday"),
    Notice(title="Project Submission", content="Final year project reports must be submitted by June 30, 2026 to the department office.", category="Academic"),
]
db.add_all(notices)
db.commit()
print("✅ Notices created")

db.close()
print("\n🎉 Database seeded successfully!")
print(f"   Student 1 ID: {student1.id} — Rohit Kumar")
print(f"   Student 2 ID: {student2.id} — Priya Sharma")