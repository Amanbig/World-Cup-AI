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
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

load_dotenv()

from ingest import get_collection_stats, ingest
from rag import stream_answer

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

# ── Serve built frontend (production Docker build) ───────────────────────────────
STATIC_DIR = Path(__file__).parent / "static"


# ── models ───────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    incident_type: str = "general"  # "var" | "tactical" | "general"



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



@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    """Streaming version of /api/chat — sends SSE chunks as the LLM generates."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    return StreamingResponse(
        stream_answer(req.message, req.incident_type),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/")
def root():
    if (STATIC_DIR / "index.html").exists():
        return FileResponse(str(STATIC_DIR / "index.html"))
    return {"service": "MatchMind API", "docs": "/docs"}


# ── SPA catch-all: must be registered AFTER all API routes ───────────────────────
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        return FileResponse(str(STATIC_DIR / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)