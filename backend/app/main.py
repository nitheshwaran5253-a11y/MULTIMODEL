from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .config import settings
from .database import engine, Base
from .sample_data.seed import seed_database
from .routers import (
    auth,
    materials,
    tutor,
    misconceptions,
    assessments,
    learning_path,
    analytics,
    evaluation,
    settings as settings_router
)

# Initialize database schemas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MindMap AI — An AI Tutor That Detects Why Students Get Answers Wrong and Rebuilds Their Learning Path"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads static directory if exists
if settings.UPLOAD_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(materials.router, prefix=settings.API_PREFIX)
app.include_router(tutor.router, prefix=settings.API_PREFIX)
app.include_router(misconceptions.router, prefix=settings.API_PREFIX)
app.include_router(assessments.router, prefix=settings.API_PREFIX)
app.include_router(learning_path.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(evaluation.router, prefix=settings.API_PREFIX)
app.include_router(settings_router.router, prefix=settings.API_PREFIX)

@app.on_event("startup")
def on_startup():
    # Ensure initial database state is available
    try:
        from .models import StudyMaterial
        from .database import SessionLocal
        db = SessionLocal()
        count = db.query(StudyMaterial).count()
        db.close()
        if count == 0:
            seed_database()
    except Exception as e:
        print(f"[Startup Warning]: {e}")

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "demo_mode": settings.DEMO_MODE,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "MindMap AI Backend"}
