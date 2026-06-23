"""
FastAPI server — bridges the React frontend to Docling ingestion and RAG.

Endpoints:
  POST /api/ingest        Upload a PDF → Docling processes it → ChromaDB
  GET  /api/status        Check knowledge base readiness
  POST /api/chat          Ask a question → RAG answer with citations
  POST /api/langflow/sync Push current chunks into a running Langflow instance
"""

import os
import shutil
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from ingest import get_collection_stats, ingest
from rag import answer

# ── app setup ───────────────────────────────────────────────────────────────────

app = FastAPI(title="MatchMind API", version="1.0.0")

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── models ───────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    incident_type: str = "general"  # "var" | "tactical" | "general"


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]
    via: str


# ── routes ───────────────────────────────────────────────────────────────────────

@app.get("/api/status")
def status():
    """Returns whether the knowledge base has been ingested and is ready."""
    stats = get_collection_stats()
    return {
        "ready": stats["ready"],
        "chunks": stats["count"],
        "collection": stats["collection"],
    }


@app.post("/api/ingest")
async def ingest_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF (FIFA Laws of the Game, VAR protocol, etc.).
    Docling parses it, chunks it, and loads it into ChromaDB.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    # Save upload to a temp file
    suffix = Path(file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        count = ingest(tmp_path)
        return {
            "message": f"Ingested {count} chunks from '{file.filename}'",
            "chunks": count,
            "filename": file.filename,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")
    finally:
        os.unlink(tmp_path)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Answer a World Cup question using RAG over the ingested FIFA documents.
    Routes through Langflow if LANGFLOW_URL/LANGFLOW_FLOW_ID are configured,
    otherwise runs direct in-process retrieval + LLM generation.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    result = await answer(req.message, req.incident_type)
    return ChatResponse(**result)


@app.get("/")
def root():
    return {"service": "MatchMind API", "docs": "/docs"}
