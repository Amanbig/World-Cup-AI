"""
Creates and uploads the MatchMind RAG flow to a running Langflow instance.

Usage:
  python create_flow.py                          # connects to localhost:7860
  python create_flow.py --url http://localhost:7860
  python create_flow.py --url http://localhost:7860 --model gpt-4o-mini

After running, copy the printed LANGFLOW_FLOW_ID into your .env file.
The flow JSON is also saved as matchmind_flow.json for manual UI import.
"""

import argparse
import json
import os
import sys
import uuid

import requests
from dotenv import load_dotenv

# Load .env from the langflow/ dir first, then fall back to the project root
_here = os.path.dirname(__file__)
load_dotenv(os.path.join(_here, ".env"))
load_dotenv(os.path.join(_here, "..", ".env"))

DEFAULT_URL   = os.getenv("LANGFLOW_URL", "http://localhost:7860")
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
DEFAULT_COLL  = os.getenv("CHROMA_COLLECTION", "fifa_rules")
DEFAULT_DB    = os.getenv("CHROMA_DB_PATH", "./chroma_db")


# ── Flow builder ──────────────────────────────────────────────────────────────

def build_flow(model: str, collection: str, db_path: str) -> dict:
    """
    Builds a Langflow 1.x compatible flow JSON:
      ChatInput → Chroma retriever → Prompt template → OpenAI LLM → ChatOutput
    """
    nid = lambda: str(uuid.uuid4())

    n_input   = nid()
    n_chroma  = nid()
    n_prompt  = nid()
    n_llm     = nid()
    n_output  = nid()

    SYSTEM_PROMPT = (
        "You are MatchMind, an expert FIFA Laws of the Game companion for the World Cup.\n"
        "Explain VAR decisions, tactical shifts, and football rules with precision.\n"
        "Always cite the specific FIFA Law (e.g. 'Law 11 – Offside').\n"
        "Base your answer only on the retrieved context below.\n\n"
        "Context from FIFA documents:\n{context}\n\n"
        "Question: {question}\n\n"
        "Answer:"
    )

    nodes = [
        # ── 1. Chat input ──────────────────────────────────────────────────────
        {
            "id": n_input, "type": "ChatInput",
            "position": {"x": 50, "y": 300},
            "data": {
                "type": "ChatInput",
                "node": {
                    "display_name": "User Question",
                    "description": "Fan's question about a VAR decision or FIFA rule",
                    "template": {
                        "input_value": {"type": "str", "value": "", "display_name": "Message"},
                    },
                },
            },
        },
        # ── 2. Chroma retriever ────────────────────────────────────────────────
        {
            "id": n_chroma, "type": "Chroma",
            "position": {"x": 350, "y": 120},
            "data": {
                "type": "Chroma",
                "node": {
                    "display_name": "FIFA Rules Chroma",
                    "description": "Vector store built by ingest.py (Docling + sentence-transformers)",
                    "template": {
                        "collection_name":    {"type": "str",   "value": collection,     "display_name": "Collection Name"},
                        "persist_directory":  {"type": "str",   "value": db_path,        "display_name": "Persist Directory"},
                        "number_of_results":  {"type": "int",   "value": 5,              "display_name": "Top-K Results"},
                        "search_type":        {"type": "str",   "value": "Similarity",   "display_name": "Search Type"},
                        "embedding_model":    {"type": "str",   "value": "all-MiniLM-L6-v2", "display_name": "Embedding Model"},
                    },
                },
            },
        },
        # ── 3. Prompt template ────────────────────────────────────────────────
        {
            "id": n_prompt, "type": "Prompt",
            "position": {"x": 650, "y": 300},
            "data": {
                "type": "Prompt",
                "node": {
                    "display_name": "MatchMind Prompt",
                    "description": "Combines retrieved FIFA context with the user question",
                    "template": {
                        "template": {"type": "str", "value": SYSTEM_PROMPT, "display_name": "Template"},
                        "context":  {"type": "str", "value": "",            "display_name": "Context"},
                        "question": {"type": "str", "value": "",            "display_name": "Question"},
                    },
                },
            },
        },
        # ── 4. LLM (OpenAI — swap model_name for WatsonX Granite) ────────────
        {
            "id": n_llm, "type": "OpenAI",
            "position": {"x": 950, "y": 300},
            "data": {
                "type": "OpenAI",
                "node": {
                    "display_name": "LLM (OpenAI / Granite)",
                    "description": "Generates the final explanation. Change model_name for WatsonX.",
                    "template": {
                        "model_name":    {"type": "str",   "value": model, "display_name": "Model Name"},
                        "temperature":   {"type": "float", "value": 0.3,   "display_name": "Temperature"},
                        "max_tokens":    {"type": "int",   "value": 1024,  "display_name": "Max Tokens"},
                        "openai_api_key":{"type": "str",   "value": os.getenv("OPENAI_API_KEY", ""), "password": True, "display_name": "OpenAI API Key"},
                    },
                },
            },
        },
        # ── 5. Chat output ────────────────────────────────────────────────────
        {
            "id": n_output, "type": "ChatOutput",
            "position": {"x": 1250, "y": 300},
            "data": {
                "type": "ChatOutput",
                "node": {
                    "display_name": "Answer",
                    "description": "Final answer returned to the MatchMind frontend",
                    "template": {},
                },
            },
        },
    ]

    edges = [
        # question text → chroma search query
        {"id": nid(), "source": n_input,  "target": n_chroma, "sourceHandle": "text",    "targetHandle": "search_query"},
        # chroma results → prompt context
        {"id": nid(), "source": n_chroma, "target": n_prompt, "sourceHandle": "results", "targetHandle": "context"},
        # question text → prompt question
        {"id": nid(), "source": n_input,  "target": n_prompt, "sourceHandle": "text",    "targetHandle": "question"},
        # prompt → LLM
        {"id": nid(), "source": n_prompt, "target": n_llm,    "sourceHandle": "prompt",  "targetHandle": "prompt"},
        # LLM → output
        {"id": nid(), "source": n_llm,    "target": n_output, "sourceHandle": "text",    "targetHandle": "input_value"},
    ]

    return {
        "name": "MatchMind RAG",
        "description": "World Cup AI — explains VAR decisions and FIFA Laws from ingested PDFs",
        "data": {
            "nodes": nodes,
            "edges": edges,
            "viewport": {"x": 0, "y": 0, "zoom": 0.75},
        },
        "is_component": False,
    }


# ── Auth ──────────────────────────────────────────────────────────────────────

def get_token(url: str) -> str | None:
    """Return a bearer token via API key (preferred) or auto-login."""
    api_key = os.getenv("LANGFLOW_API_KEY")
    if api_key:
        return api_key

    user = os.getenv("LANGFLOW_USERNAME", "admin")
    pwd  = os.getenv("LANGFLOW_PASSWORD", "admin")
    try:
        resp = requests.post(
            f"{url}/api/v1/login",
            data={"username": user, "password": pwd},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        if resp.ok:
            return resp.json().get("access_token")
    except Exception:
        pass
    return None


# ── Upload ────────────────────────────────────────────────────────────────────

def upload(url: str, flow: dict) -> str:
    api_key = os.getenv("LANGFLOW_API_KEY")
    headers = {"Content-Type": "application/json"}

    if api_key:
        headers["x-api-key"] = api_key
    else:
        token = get_token(url)
        if token:
            headers["Authorization"] = f"Bearer {token}"

    resp = requests.post(
        f"{url}/api/v1/flows/",
        json=flow,
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["id"]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Upload MatchMind RAG flow to Langflow")
    parser.add_argument("--url",   default=DEFAULT_URL,   help=f"Langflow server URL (default: {DEFAULT_URL})")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"LLM model name (default: {DEFAULT_MODEL})")
    args = parser.parse_args()

    print(f"Building MatchMind RAG flow (model: {args.model})…")
    flow = build_flow(model=args.model, collection=DEFAULT_COLL, db_path=DEFAULT_DB)

    # Always save a local copy — useful for manual import or version control
    out_path = os.path.join(os.path.dirname(__file__), "matchmind_flow.json")
    with open(out_path, "w") as f:
        json.dump(flow, f, indent=2)
    print(f"Saved {out_path}  (can be imported via Langflow UI → Import)")

    print(f"\nUploading to {args.url} …")
    try:
        flow_id = upload(args.url, flow)
    except requests.ConnectionError:
        print(f"\nCould not connect to Langflow at {args.url}")
        print("Make sure Langflow is running:")
        print("  docker compose up langflow   (Docker)")
        print("  langflow run                 (local)")
        print(f"\nOr import {out_path} manually via the Langflow UI.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUpload failed: {e}")
        print(f"You can still import {out_path} manually via the Langflow UI.")
        sys.exit(1)

    print(f"\nFlow created!")
    print(f"  Flow ID : {flow_id}")
    print(f"\nAdd these to your .env:")
    print(f"  LANGFLOW_URL={args.url}")
    print(f"  LANGFLOW_FLOW_ID={flow_id}")
    print(f"\nThen restart the app:  docker compose restart app")


if __name__ == "__main__":
    main()
