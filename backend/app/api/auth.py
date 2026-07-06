from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.services.auth_service import register_user, login_user
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "student"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    user = register_user(db, request.email, request.password, request.role)
    if not user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return {
        "message": "User registered successfully",
        "email": user.email,
        "role": user.role
    }

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    result = login_user(db, request.email, request.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return result