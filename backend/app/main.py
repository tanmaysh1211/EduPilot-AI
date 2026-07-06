from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine
from app.database import models
# from app.api import auth, attendance, marks, timetable, student, chat
from app.api import attendance, marks, timetable, chat, auth, student, calendar , notices , profile , teacher , notifications , disputes 

# print("1")

# from fastapi import FastAPI
# print("2")

# from app.api import attendance
# print("3")

# from app.api import marks
# print("4")

# from app.api import timetable
# print("5")

# from app.api import chat
# print("6")

# from app.api import auth
# print("7")

# from app.api import student
# print("8")

# from app.api import calendar
# print("9")



# models.Base.metadata.create_all(bind=engine)

# print("before create_all")

models.Base.metadata.create_all(bind=engine)

# print("after create_all")

app = FastAPI(
    title="EduPilot AI",
    description="GenAI-powered ERP Copilot",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(marks.router)
app.include_router(timetable.router)
app.include_router(student.router)
app.include_router(chat.router)
app.include_router(calendar.router)
app.include_router(notices.router)
app.include_router(profile.router)
print("INCLUDING TEACHER ROUTER")
app.include_router(teacher.router)
app.include_router(notifications.router)
app.include_router(disputes.router)

@app.get("/")
def root():
    return {"message": "EduPilot AI Backend is running!", "status": "success"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "project": "EduPilot AI"}