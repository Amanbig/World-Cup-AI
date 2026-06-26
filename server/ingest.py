"""
Docling-powered PDF ingestion pipeline.

Docling understands PDF layout — tables, headings, captions — giving much better
chunks than raw text extraction (PyMuPDF).

Usage:
  python ingest.py --pdf path/to/fifa_laws.pdf
  python ingest.py --pdf path/to/fifa_laws.pdf --collection var_rules
"""

import argparse
import os
from pathlib import Path
from typing import Generator

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from docling.chunking import HybridChunker
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.document_converter import DocumentConverter, PdfFormatOption
from dotenv import load_dotenv

load_dotenv()

CHROMA_DB_PATH = os.getenv("CHROMA_DB_PATH", str(Path(__file__).parent / "chroma_db"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "fifa_rules")


def _iter_chunks(pdf_path: str) -> Generator[dict, None, None]:
    print(f"[ingest] Parsing {pdf_path} with Docling…")
    
    # Configure pipeline options to disable OCR (speed up CPU processing)
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = False
    
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    result = converter.convert(pdf_path)

    # HybridChunker: respects heading boundaries + token limit
    chunker = HybridChunker(
        tokenizer="sentence-transformers/all-MiniLM-L6-v2",
        max_tokens=200,
    )

    for chunk in chunker.chunk(result.document):
        # Last heading in the hierarchy = section name
        headings = getattr(chunk.meta, "headings", None) or []
        section = headings[-1] if headings else "General"

        # Page number from provenance (first item)
        page = 1
        try:
            items = getattr(chunk.meta, "doc_items", None) or []
            if items and items[0].prov:
                page = items[0].prov[0].page_no
        except Exception:
            pass

        yield {"text": chunk.text, "section": section, "page": page}


def ingest(pdf_path: str, collection_name: str = CHROMA_COLLECTION) -> int:
    pdf_path = str(Path(pdf_path).resolve())

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
                {"section": c["section"], "page": str(c["page"]), "source": source_name}
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
