"""
Docling-powered PDF ingestion pipeline.

Usage:
  python ingest.py --pdf path/to/fifa_laws.pdf
  python ingest.py --pdf path/to/var_protocol.pdf --collection var_rules

Docling extracts structured text (headings, paragraphs, tables) from PDFs,
preserving document hierarchy so chunks carry meaningful context for RAG.
"""

import argparse
import json
import os
import re
from pathlib import Path
from typing import Generator

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from dotenv import load_dotenv

load_dotenv()

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
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
            # keep overlap: last ~overlap chars of previous chunk
            current = current[-overlap:] + " " + sentence
        else:
            current = (current + " " + sentence).strip()
    if current:
        chunks.append(current.strip())
    return chunks


def _iter_chunks(result) -> Generator[dict, None, None]:
    """
    Walk the Docling document and yield {text, section, page, label} dicts.
    Groups headings with their following paragraphs to preserve context.
    """
    doc = result.document
    current_section = "General"

    for item, _level in doc.iterate_items():
        label = getattr(item, "label", None)
        label_str = label.value if label else "text"
        raw_text = getattr(item, "text", "").strip()

        if not raw_text:
            continue

        # Track section headings
        if label_str in ("section_header", "title"):
            current_section = raw_text
            continue  # don't index headings as standalone chunks

        page = None
        if getattr(item, "prov", None):
            page = item.prov[0].page_no

        for chunk_text in _split_text(raw_text):
            yield {
                "text": chunk_text,
                "section": current_section,
                "page": page,
                "label": label_str,
            }


def ingest(pdf_path: str, collection_name: str = CHROMA_COLLECTION) -> int:
    """
    Parse `pdf_path` with Docling, chunk it, embed with sentence-transformers,
    and upsert into ChromaDB. Returns number of chunks stored.
    """
    pdf_path = str(Path(pdf_path).resolve())
    print(f"[ingest] Converting {pdf_path} with Docling…")

    converter = DocumentConverter()
    result = converter.convert(pdf_path, raises_on_error=True)

    chunks = list(_iter_chunks(result))
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

    # Upsert in batches of 200
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
                    "page": str(c["page"]) if c["page"] else "?",
                    "label": c["label"],
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
