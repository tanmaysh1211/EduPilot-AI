"""
One-off migration for the teacher-role feature.
Adds Subject.credits, creates TeacherSubject, Notification, Dispute tables.

Run this AFTER updating models.py with the new classes/column.
"""
from app.database.connection import engine
from app.database.models import Base, Subject, TeacherSubject, Notification, Dispute
from sqlalchemy import text

print("Creating new tables: teacher_subjects, notifications, disputes...")
Base.metadata.create_all(engine, tables=[
    TeacherSubject.__table__,
    Notification.__table__,
    Dispute.__table__,
])

print("Adding `credits` column to subjects table...")
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE subjects ADD COLUMN credits INTEGER DEFAULT 3"))
        conn.commit()
        print("Column added.")
    except Exception as e:
        # Will fail harmlessly if the column already exists from a previous run
        print(f"Note: {e}")

print("Migration complete.")