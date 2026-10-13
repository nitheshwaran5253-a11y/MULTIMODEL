from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import MaterialChunk
from ..services.evaluation_engine import EvaluationEngine

router = APIRouter(prefix="/evaluation", tags=["System Evaluation"])

@router.get("/run")
def run_system_evaluation(db: Session = Depends(get_db)):
    """
    Executes live evaluation harness over current active study material chunks
    and returns verified metrics.
    """
    chunks = db.query(MaterialChunk).options(joinedload(MaterialChunk.material)).all()
    results = EvaluationEngine.run_benchmark(chunks)
    return results
