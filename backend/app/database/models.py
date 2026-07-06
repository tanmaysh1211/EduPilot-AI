from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    roll_number = Column(String, unique=True)
    department = Column(String)
    semester = Column(Integer)
    user = relationship("User")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    code = Column(String, unique=True)
    semester = Column(Integer)
    department = Column(String)
    credits = Column(Integer, default=3)   # NEW: 3 or 4


# 2. ADD this new class — maps which teacher can teach which (subject, semester):
class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    semester = Column(Integer)
    teacher = relationship("User")
    subject = relationship("Subject")
 

# 3. ADD this new class — notifications for students:
class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    type = Column(String)              # "attendance" | "marks" | "class_scheduled" | "notice" | "query_response"
    message = Column(String)
    related_id = Column(Integer, nullable=True)   # optional: links back to the attendance/marks row in question
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    student = relationship("Student")
 
 
# 4. ADD this new class — student disputes/queries directed at teachers:
class Dispute(Base):
    __tablename__ = "disputes"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    teacher_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String)              # "attendance" | "marks"
    related_id = Column(Integer)       # the specific attendance/marks row id being disputed
    student_message = Column(String)
    status = Column(String, default="open")   # "open" | "resolved" | "rejected"
    teacher_response = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    student = relationship("Student")
    teacher = relationship("User")
 

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    date = Column(DateTime)
    is_present = Column(Boolean, default=False)
    student = relationship("Student")
    subject = relationship("Subject")

class Marks(Base):
    __tablename__ = "marks"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    exam_type = Column(String)
    marks_obtained = Column(Float)
    total_marks = Column(Float)
    student = relationship("Student")
    subject = relationship("Subject")

# class Timetable(Base):
#     __tablename__ = "timetable"
#     id = Column(Integer, primary_key=True, index=True)
#     subject_id = Column(Integer, ForeignKey("subjects.id"))
#     date = Column(DateTime)         
#     day = Column(String)             
#     start_time = Column(String)
#     end_time = Column(String)
#     room = Column(String)
#     semester = Column(Integer)
#     subject = relationship("Subject")

class Timetable(Base):
    __tablename__ = "timetable"

    id = Column(Integer, primary_key=True, index=True)

    subject_id = Column(Integer, ForeignKey("subjects.id"))

    date = Column(DateTime)

    day = Column(String)

    start_time = Column(String)

    end_time = Column(String)

    room = Column(String)

    semester = Column(Integer)

    # ------------------------------
    # NEW FIELDS
    # ------------------------------

    # PENDING -> Academic Section created timetable
    # CLASS -> Teacher confirmed class
    # NO_CLASS -> Teacher cancelled class
    status = Column(String, default="PENDING")

    # Teacher who updated this row
    updated_by_teacher = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    updated_at = Column(
        DateTime,
        nullable=True
    )

    subject = relationship(
        "Subject",
        foreign_keys=[subject_id]
    )

    teacher = relationship(
        "User",
        foreign_keys=[updated_by_teacher]
    )

class Holiday(Base):
    __tablename__ = "holidays"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime)
    label = Column(String)
    type = Column(String, default="holiday")  # "holiday" | "exam" | "event"

class Notice(Base):
    __tablename__ = "notices"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = Column(String)