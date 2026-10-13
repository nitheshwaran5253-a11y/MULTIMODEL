import json
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from datetime import datetime

from ..database import get_db
from ..config import settings
from ..models import StudyMaterial, MaterialChunk
from ..schemas import StudyMaterialResponse, MaterialChunkResponse, ExtractedContentDetail
from ..services.document_parser import DocumentParserService
from ..services.vector_store import VectorStoreService

router = APIRouter(prefix="/materials", tags=["Study Materials"])

@router.get("", response_model=List[StudyMaterialResponse])
def list_materials(
    search: Optional[str] = None,
    file_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(StudyMaterial)
    if search:
        query = query.filter(StudyMaterial.title.ilike(f"%{search}%") | StudyMaterial.filename.ilike(f"%{search}%"))
    if file_type and file_type != "all":
        query = query.filter(StudyMaterial.file_type == file_type)

    materials = query.order_by(StudyMaterial.upload_date.desc()).all()
    results = []
    for m in materials:
        results.append(StudyMaterialResponse(
            id=m.id,
            title=m.title,
            filename=m.filename,
            file_type=m.file_type,
            file_size_bytes=m.file_size_bytes,
            subject=m.subject,
            status=m.status,
            chunk_count=m.chunk_count,
            topics=m.get_topics(),
            upload_date=m.upload_date
        ))
    return results

@router.get("/{material_id}", response_model=ExtractedContentDetail)
def get_material_detail(material_id: int, db: Session = Depends(get_db)):
    mat = db.query(StudyMaterial).filter_by(id=material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    chunks = db.query(MaterialChunk).filter_by(material_id=material_id).order_by(MaterialChunk.chunk_index).all()
    chunk_responses = [
        MaterialChunkResponse(
            id=c.id,
            chunk_index=c.chunk_index,
            content=c.content,
            source_location=c.source_location,
            page_number=c.page_number,
            slide_number=c.slide_number,
            timestamp_seconds=c.timestamp_seconds,
            topic=c.topic
        ) for c in chunks
    ]

    mat_response = StudyMaterialResponse(
        id=mat.id,
        title=mat.title,
        filename=mat.filename,
        file_type=mat.file_type,
        file_size_bytes=mat.file_size_bytes,
        subject=mat.subject,
        status=mat.status,
        chunk_count=mat.chunk_count,
        topics=mat.get_topics(),
        upload_date=mat.upload_date
    )

    return ExtractedContentDetail(material=mat_response, chunks=chunk_responses)

@router.post("/upload")
async def upload_material(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    subject: Optional[str] = Form("Java Programming"),
    db: Session = Depends(get_db)
):
    """
    Upload and process multimodal study material (PDF, PPTX, or Video transcript).
    Validates file format, chunks with location preservation, generates vector embeddings.
    """
    filename = file.filename or "uploaded_file"
    ext = Path(filename).suffix.lower()

    # Determine file type
    if ext == ".pdf":
        file_type = "pdf"
    elif ext in (".pptx", ".ppt"):
        file_type = "pptx"
    elif ext in (".vtt", ".srt", ".txt", ".transcript"):
        file_type = "video_transcript"
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Please upload PDF (.pdf), PowerPoint (.pptx), or Video Transcript (.txt, .vtt, .srt)"
        )

    # Save to disk
    save_path = settings.UPLOAD_DIR / f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = save_path.stat().st_size
    mat_title = title or filename.rsplit(".", 1)[0].replace("_", " ").title()

    # Initial record in PROCESSING state
    mat = StudyMaterial(
        title=mat_title,
        filename=filename,
        file_type=file_type,
        file_path=str(save_path),
        file_size_bytes=file_size,
        subject=subject,
        status="PROCESSING",
        chunk_count=0,
        topics_extracted="[]"
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)

    try:
        # Extract content using dedicated multimodal parser
        parsed_chunks = DocumentParserService.parse_file(save_path, file_type)
        if not parsed_chunks:
            raise ValueError("No extractable textual content discovered in the file.")

        extracted_topics = DocumentParserService.extract_topics_list(parsed_chunks)

        for idx, c in enumerate(parsed_chunks):
            emb = VectorStoreService.generate_embedding(c.content)
            chunk = MaterialChunk(
                material_id=mat.id,
                chunk_index=idx,
                content=c.content,
                source_location=c.source_location,
                page_number=c.page_number,
                slide_number=c.slide_number,
                timestamp_seconds=c.timestamp_seconds,
                topic=c.topic,
                subtopic=c.subtopic,
                embedding_json=json.dumps(emb)
            )
            db.add(chunk)

        # Mark as successfully processed
        mat.status = "PROCESSED"
        mat.chunk_count = len(parsed_chunks)
        mat.topics_extracted = json.dumps(extracted_topics)
        db.commit()

        return {
            "success": True,
            "material_id": mat.id,
            "message": f"Successfully processed {len(parsed_chunks)} content chunks with source locations.",
            "status": "PROCESSED",
            "chunk_count": len(parsed_chunks),
            "topics": extracted_topics
        }

    except Exception as e:
        mat.status = "FAILED"
        mat.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    mat = db.query(StudyMaterial).filter_by(id=material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    try:
        if Path(mat.file_path).exists():
            Path(mat.file_path).unlink()
    except Exception:
        pass

    db.delete(mat)
    db.commit()
    return {"success": True, "message": f"Material '{mat.title}' deleted successfully."}
