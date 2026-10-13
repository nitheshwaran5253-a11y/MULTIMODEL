from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User

router = APIRouter(prefix="/auth", tags=["Authentication & User"])

@router.get("/me")
def get_current_user(db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=1).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "avatar": user.avatar,
        "streak_days": user.streak_days,
        "created_at": user.created_at
    }

@router.post("/login")
def login(credentials: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter_by(id=1).first()
    return {
        "access_token": "demo_jwt_token_alex_johnson",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar": user.avatar,
            "streak_days": user.streak_days
        }
    }
