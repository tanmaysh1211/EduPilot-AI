from app.database.connection import SessionLocal
from app.database.models import User, Student, Subject, Attendance, Marks
from app.services.auth_service import hash_password
from datetime import datetime, timedelta
import random

db = SessionLocal()

print("Seeding 15 additional students for class-average data...")

first_names = ["Aman", "Sneha", "Vikram", "Pooja", "Arjun", "Neha", "Karan", "Divya",
               "Rahul", "Anjali", "Saurabh", "Ritu", "Manish", "Kavya", "Yash"]
last_names = ["Gupta", "Verma", "Singh", "Reddy", "Nair", "Iyer", "Mehta", "Joshi",
              "Kapoor", "Chauhan", "Patel", "Rao", "Bose", "Malhotra", "Pillai"]

all_subjects = db.query(Subject).filter(Subject.semester.in_([1, 2, 3])).all()
if not all_subjects:
    print("No subjects found for Sem 1/2/3. Run seed_data.py and seed_past_semesters.py first.")
    db.close()
    exit()

existing_count = db.query(Student).count()
print(f"Currently {existing_count} students in DB.")

exam_types = ["Internal 1", "Internal 2", "External"]
total_marks_map = {"Internal 1": 30, "Internal 2": 30, "External": 100}

created = 0
for i in range(15):
    fname = first_names[i]
    lname = last_names[i]
    email = f"{fname.lower()}.{lname.lower()}@EduPilot.com"

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        continue

    user = User(email=email, hashed_password=hash_password("student123"), role="student")
    db.add(user)
    db.commit()
    db.refresh(user)

    roll_number = f"CSE2021{100 + i:03d}"
    student = Student(
        user_id=user.id,
        name=f"{fname} {lname}",
        roll_number=roll_number,
        department="CSE",
        semester=3
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    for subject in all_subjects:
        days_ago_start = 200 if subject.semester == 1 else (100 if subject.semester == 2 else 0)
        for d in range(20 if subject.semester == 3 else 30):
            date = datetime.now() - timedelta(days=days_ago_start + d)
            is_present = random.choices([True, False], weights=[80, 20])[0]
            db.add(Attendance(
                student_id=student.id,
                subject_id=subject.id,
                date=date,
                is_present=is_present
            ))

        for exam in exam_types:
            total = total_marks_map[exam]
            obtained = random.randint(int(total * 0.45), total)
            db.add(Marks(
                student_id=student.id,
                subject_id=subject.id,
                exam_type=exam,
                marks_obtained=obtained,
                total_marks=total
            ))

    db.commit()
    created += 1
    print(f"  Created {student.name} ({roll_number})")

print(f"\nDone. Created {created} new students with full attendance + marks across Sem 1/2/3.")
db.close()