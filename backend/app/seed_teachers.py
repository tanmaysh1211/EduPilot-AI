from app.database.connection import SessionLocal
from app.database.models import Subject, User, TeacherSubject
from app.services.auth_service import hash_password

db = SessionLocal()

print("Assigning credits and creating teacher accounts...")

# Which subject is the 4-credit one per semester (the rest default to 3)
FOUR_CREDIT_SUBJECT = {
    1: "Python",              # Sem 1 — lab-heavy
    2: "Operating Systems" if db.query(Subject).filter(Subject.semester == 2, Subject.name == "Operating Systems").first() else "BME",
    3: "DBMS",                # Sem 3 — lab-heavy
}

for sem, subject_name in FOUR_CREDIT_SUBJECT.items():
    subjects_in_sem = db.query(Subject).filter(Subject.semester == sem).all()
    for s in subjects_in_sem:
        s.credits = 4 if s.name == subject_name else 3
db.commit()
print("Credits assigned:")
for sem in [1, 2, 3]:
    for s in db.query(Subject).filter(Subject.semester == sem).all():
        print(f"  Sem {sem} - {s.name}: {s.credits} credit(s)")

# Create teacher accounts, one per (teacher, set of subjects across different semesters)
# Example: Teacher A teaches Physics (Sem 2) AND DBMS (Sem 3) — different sems, allowed.
# Rule: a teacher can only have ONE subject per semester.
teacher_assignments = [
    {"name": "Prof. Anita Rao", "email": "anita.rao@EduPilot.com", "assignments": [
        ("DBMS", 3),
    ]},
    {"name": "Prof. Suresh Iyer", "email": "suresh.iyer@EduPilot.com", "assignments": [
        ("Data Structures", 3),
    ]},
    {"name": "Prof. Meena Joshi", "email": "meena.joshi@EduPilot.com", "assignments": [
        ("Operating Systems", 3),
        ("Physics", 2),
    ]},
    {"name": "Prof. Vikas Nair", "email": "vikas.nair@EduPilot.com", "assignments": [
        ("Computer Networks", 3),
        ("Maths - II", 2),
    ]},
    {"name": "Prof. Kavita Sharma", "email": "kavita.sharma@EduPilot.com", "assignments": [
        ("Web Technologies", 3),
        ("Python", 1),
    ]},
]

created = 0
for t in teacher_assignments:
    existing = db.query(User).filter(User.email == t["email"]).first()
    if existing:
        teacher_user = existing
    else:
        teacher_user = User(email=t["email"], hashed_password=hash_password("teacher123"), role="teacher")
        db.add(teacher_user)
        db.commit()
        db.refresh(teacher_user)
        created += 1

    for subject_name, semester in t["assignments"]:
        subject = db.query(Subject).filter(Subject.name == subject_name, Subject.semester == semester).first()
        if not subject:
            print(f"  WARNING: could not find subject '{subject_name}' in semester {semester}, skipping")
            continue
        already_assigned = db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == teacher_user.id,
            TeacherSubject.subject_id == subject.id
        ).first()
        if not already_assigned:
            db.add(TeacherSubject(teacher_id=teacher_user.id, subject_id=subject.id, semester=semester))

db.commit()
print(f"\nCreated {created} new teacher accounts (password: teacher123 for all).")
print("Teacher -> subject assignments:")
for t in teacher_assignments:
    print(f"  {t['name']} ({t['email']}): {t['assignments']}")

db.close()