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

import httpx
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



@app.get("/api/matches/live")
async def matches_live():
    """Proxy ESPN public API to get current World Cup 2026 matches (no API key needed)."""
    competition = os.getenv("ESPN_WC_COMPETITION", "fifa.world")
    url = f"https://site.api.espn.com/apis/site/v2/sports/soccer/{competition}/scoreboard"
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(url, headers={"User-Agent": "MatchMind/1.0"})
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        return {"matches": [], "error": str(e)}

    matches = []
    for event in data.get("events", []):
        comp = (event.get("competitions") or [{}])[0]
        competitors = comp.get("competitors", [])
        home = next((c for c in competitors if c.get("homeAway") == "home"), None)
        away = next((c for c in competitors if c.get("homeAway") == "away"), None)
        if not home or not away:
            continue

        status_obj = event.get("status", {})
        status_type = status_obj.get("type", {}).get("name", "")
        is_live = status_type in ("STATUS_IN_PROGRESS",)

        # Try to extract round/stage from competition notes or season type
        stage = "Group Stage"
        for note in comp.get("notes", []):
            h = note.get("headline", "")
            if h:
                stage = h
                break

        try:
            home_score = int(home.get("score") or 0)
            away_score = int(away.get("score") or 0)
        except (TypeError, ValueError):
            home_score = away_score = 0

        matches.append({
            "id": f"live-{event.get('id', '')}",
            "year": 2026,
            "stage": stage,
            "home": home["team"]["displayName"],
            "away": away["team"]["displayName"],
            "homeScore": home_score,
            "awayScore": away_score,
            "live": is_live,
        })

    return {"matches": matches}


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