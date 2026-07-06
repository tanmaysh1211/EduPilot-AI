from sqlalchemy.orm import Session
from app.database.models import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "EduPilot-secret")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def register_user(db: Session, email: str, password: str, role: str = "student"):
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return None
    hashed = hash_password(password)
    user = User(email=email, hashed_password=hashed, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    token = create_access_token({"sub": user.email, "role": user.role})
    # return {"access_token": token, "token_type": "bearer"}
    response = {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
    }
 
    # If this is a student, also resolve their student_id (the frontend
    # needs this for all the existing /attendance/{id}, /marks/{id} etc. calls)
    if user.role == "student":
        from app.database.models import Student
        student = db.query(Student).filter(Student.user_id == user.id).first()
        response["student_id"] = student.id if student else None
 
    return response