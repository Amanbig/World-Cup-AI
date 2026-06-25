"""
PyMuPDF-powered PDF ingestion pipeline.

Usage:
  python ingest.py --pdf path/to/fifa_laws.pdf
  python ingest.py --pdf path/to/var_protocol.pdf --collection var_rules

PyMuPDF extracts structured text from PDFs, which is chunked and embedded
with sentence-transformers before being stored in ChromaDB for RAG.
"""

import argparse
import os
import re
from pathlib import Path
from typing import Generator

import chromadb
import fitz  # pymupdf
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from dotenv import load_dotenv

load_dotenv()

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", str(Path(__file__).parent / "chroma_db"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "fifa_rules")

CHUNK_MAX_CHARS = 800
CHUNK_OVERLAP_CHARS = 100


def _split_text(text: str, max_chars: int = CHUNK_MAX_CHARS, overlap: int = CHUNK_OVERLAP_CHARS) -> list[str]:
    """Split long text into overlapping chunks on sentence boundaries."""
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks, current = [], ""
    for sentence in sentences:
        if len(current) + len(sentence) > max_chars and current:
            chunks.append(current.strip())
            current = current[-overlap:] + " " + sentence
        else:
            current = (current + " " + sentence).strip()
    if current:
        chunks.append(current.strip())
    return chunks


def _iter_chunks(pdf_path: str) -> Generator[dict, None, None]:
    """
    Walk the PDF page by page and yield {text, section, page} dicts.
    Tracks section headings by detecting ALL-CAPS or short bold-like lines.
    """
    doc = fitz.open(pdf_path)
    current_section = "General"

    for page in doc:
        page_no = page.number + 1
        blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, block_type)

        for block in blocks:
            raw_text = block[4].strip()
            if not raw_text:
                continue

            # Heuristic: short ALL-CAPS lines are likely section headings
            if len(raw_text) < 80 and raw_text.isupper():
                current_section = raw_text
                continue

            for chunk_text in _split_text(raw_text):
                yield {
                    "text": chunk_text,
                    "section": current_section,
                    "page": page_no,
                }

    doc.close()


def ingest(pdf_path: str, collection_name: str = CHROMA_COLLECTION) -> int:
    """
    Parse `pdf_path` with PyMuPDF, chunk it, embed with sentence-transformers,
    and upsert into ChromaDB. Returns number of chunks stored.
    """
    pdf_path = str(Path(pdf_path).resolve())
    print(f"[ingest] Parsing {pdf_path} with PyMuPDF…")

    chunks = list(_iter_chunks(pdf_path))
    print(f"[ingest] Extracted {len(chunks)} chunks")

    embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

    # Replace existing collection so re-runs stay clean
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    collection = client.create_collection(
        name=collection_name,
        embedding_function=embed_fn,
        metadata={"hnsw:space": "cosine"},
    )

    source_name = Path(pdf_path).name
    batch_size = 200
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        collection.add(
            ids=[f"{source_name}_{i + j}" for j, _ in enumerate(batch)],
            documents=[c["text"] for c in batch],
            metadatas=[
                {
                    "section": c["section"],
                    "page": str(c["page"]),
                    "source": source_name,
                }
                for c in batch
            ],
        )
        print(f"[ingest] Stored batch {i // batch_size + 1}/{-(-len(chunks) // batch_size)}")

    print(f"[ingest] Done. {len(chunks)} chunks in collection '{collection_name}'")
    return len(chunks)


def get_collection_stats(collection_name: str = CHROMA_COLLECTION) -> dict:
    embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    try:
        col = client.get_collection(collection_name, embedding_function=embed_fn)
        return {"collection": collection_name, "count": col.count(), "ready": True}
    except Exception:
        return {"collection": collection_name, "count": 0, "ready": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest a PDF into the FIFA rules vector store")
    parser.add_argument("--pdf", required=True, help="Path to the PDF file")
    parser.add_argument("--collection", default=CHROMA_COLLECTION, help="ChromaDB collection name")
    args = parser.parse_args()
    ingest(args.pdf, args.collection)
