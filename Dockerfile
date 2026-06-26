# ── Stage 1: Build Vite frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend

WORKDIR /app

COPY client/package*.json ./
RUN npm ci --ignore-scripts

COPY client/index.html client/vite.config.ts client/tsconfig*.json client/eslint.config.js ./
COPY client/public ./public
COPY client/src ./src

RUN npm run build
# Output: /app/dist


# ── Stage 2: Python server + built frontend ───────────────────────────────────
FROM python:3.11-slim AS server

WORKDIR /app

# System deps needed by chromadb / sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc g++ libgomp1 curl \
    && rm -rf /var/lib/apt/lists/*

# CPU-only torch — prevents sentence-transformers pulling the 2 GB CUDA build
RUN pip install --no-cache-dir torch==2.12.1+cpu --index-url https://download.pytorch.org/whl/cpu

# Python deps (separate layer for cache efficiency)
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download models so first ingest doesn't stall
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
RUN python -c "from docling.document_converter import DocumentConverter; DocumentConverter()"

# Copy server source
COPY server/ .

# Serve built frontend from ./static (FastAPI mounts it at /)
COPY --from=frontend /app/dist ./static

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/status || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
