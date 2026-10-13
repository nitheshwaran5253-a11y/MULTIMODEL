from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..sample_data.seed import seed_database

router = APIRouter(prefix="/settings", tags=["Settings & Configuration"])

class SettingsUpdate(BaseModel):
    demo_mode: Optional[bool] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    llm_model: Optional[str] = None

@router.get("")
def get_settings():
    return {
        "demo_mode": settings.DEMO_MODE,
        "has_gemini_key": bool(settings.GEMINI_API_KEY),
        "has_openai_key": bool(settings.OPENAI_API_KEY),
        "llm_model": settings.LLM_MODEL,
        "database_url": settings.DATABASE_URL.split("///")[-1] if "///" in settings.DATABASE_URL else "PostgreSQL",
        "version": settings.VERSION,
        "is_live_ai_active": (bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) and not settings.DEMO_MODE)
    }

@router.post("/update")
def update_settings(payload: SettingsUpdate):
    if payload.demo_mode is not None:
        settings.DEMO_MODE = payload.demo_mode
    if payload.gemini_api_key is not None:
        settings.GEMINI_API_KEY = payload.gemini_api_key
    if payload.openai_api_key is not None:
        settings.OPENAI_API_KEY = payload.openai_api_key
    if payload.llm_model is not None:
        settings.LLM_MODEL = payload.llm_model

    return {
        "success": True,
        "demo_mode": settings.DEMO_MODE,
        "is_live_ai_active": (bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY) and not settings.DEMO_MODE)
    }

@router.post("/reset-demo-data")
def reset_demo_data():
    seed_database()
    return {"success": True, "message": "Demo data successfully re-seeded to initial state!"}
