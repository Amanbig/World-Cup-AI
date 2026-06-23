"""
RAG (Retrieval-Augmented Generation) layer.

Two execution paths:
  1. Langflow path  – if LANGFLOW_URL + LANGFLOW_FLOW_ID are set, the query is
                      forwarded to a running Langflow instance. The Langflow flow
                      owns the retrieval + generation logic (visual, editable).
  2. Direct path    – falls back to in-process retrieval from ChromaDB + LLM call.
                      Works with OpenAI, IBM WatsonX (Granite), or Ollama.
"""

import os
from typing import Optional

import chromadb
import httpx
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from dotenv import load_dotenv

load_dotenv()

# ── config ─────────────────────────────────────────────────────────────────────
CHROMA_DB_PATH   = os.getenv("CHROMA_DB_PATH", "./chroma_db")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "fifa_rules")

LLM_PROVIDER     = os.getenv("LLM_PROVIDER", "openai")
OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL     = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
WATSONX_API_KEY  = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT  = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL      = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WATSONX_MODEL    = os.getenv("WATSONX_MODEL", "ibm/granite-13b-chat-v2")
OLLAMA_BASE_URL  = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL     = os.getenv("OLLAMA_MODEL", "llama3.2")

LANGFLOW_URL     = os.getenv("LANGFLOW_URL", "")
LANGFLOW_FLOW_ID = os.getenv("LANGFLOW_FLOW_ID", "")

TOP_K = 5  # number of chunks to retrieve

# ── retrieval ───────────────────────────────────────────────────────────────────

def _get_collection():
    embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return client.get_collection(CHROMA_COLLECTION, embedding_function=embed_fn)


def retrieve(query: str, top_k: int = TOP_K) -> list[dict]:
    """Return the top-k most relevant chunks from ChromaDB."""
    col = _get_collection()
    results = col.query(query_texts=[query], n_results=top_k)
    chunks = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        chunks.append({"text": doc, "section": meta.get("section", ""), "page": meta.get("page", "?"), "source": meta.get("source", "")})
    return chunks


# ── prompt builder ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are MatchMind, an expert FIFA Laws of the Game companion for the World Cup.
Your role is to explain VAR decisions, tactical shifts, and football rules with precision and clarity.

Guidelines:
- Cite the specific Law or rule section you are drawing from (e.g. "Law 11 – Offside").
- Explain in plain, accessible language. Fans of all levels should understand.
- For VAR incidents, explain: what was reviewed, which rule applies, and why the decision is correct.
- For tactical questions, explain the football logic clearly.
- Be concise but complete. No unnecessary padding.
- Always base your answer on the retrieved context below — do not invent rules.
"""

INCIDENT_PREFIXES = {
    "var":      "This is a VAR DECISION question. Explain the incident, the rule applied, and whether the decision was correct.",
    "tactical": "This is a TACTICAL ANALYSIS question. Explain the tactical reasoning and expected outcome.",
    "general":  "This is a GENERAL RULE question. Explain the rule clearly with any relevant examples.",
}

def _build_prompt(query: str, chunks: list[dict], incident_type: str) -> str:
    prefix = INCIDENT_PREFIXES.get(incident_type, INCIDENT_PREFIXES["general"])
    context_parts = []
    for i, c in enumerate(chunks, 1):
        context_parts.append(
            f"[Source {i}] Section: {c['section']} | Page: {c['page']}\n{c['text']}"
        )
    context = "\n\n".join(context_parts)
    return f"{prefix}\n\nRelevant rules from FIFA Laws of the Game:\n\n{context}\n\nQuestion: {query}"


# ── LLM calls ───────────────────────────────────────────────────────────────────

async def _call_openai(prompt: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=1024,
    )
    return response.choices[0].message.content


async def _call_watsonx(prompt: str) -> str:
    """IBM Granite via WatsonX."""
    import ibm_watsonx_ai.foundation_models as fm
    from ibm_watsonx_ai import Credentials

    creds = Credentials(url=WATSONX_URL, api_key=WATSONX_API_KEY)
    model = fm.ModelInference(
        model_id=WATSONX_MODEL,
        credentials=creds,
        project_id=WATSONX_PROJECT,
        params={
            fm.schema.TextChatParameters.TEMPERATURE: 0.3,
            fm.schema.TextChatParameters.MAX_TOKENS: 1024,
        },
    )
    response = model.chat(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]
    )
    return response["choices"][0]["message"]["content"]


async def _call_ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "stream": False,
            },
        )
        response.raise_for_status()
        return response.json()["message"]["content"]


# ── Langflow path ───────────────────────────────────────────────────────────────

async def _call_langflow(query: str, incident_type: str) -> dict:
    """
    Forward the query to a Langflow flow.
    The flow is expected to:
      - Accept a chat message input
      - Perform its own RAG (Chroma + LLM nodes)
      - Return a chat message output
    """
    url = f"{LANGFLOW_URL}/api/v1/run/{LANGFLOW_FLOW_ID}"
    payload = {
        "input_value": query,
        "input_type": "chat",
        "output_type": "chat",
        "tweaks": {
            # Pass incident type as a tweak so the flow can adjust its prompt
            "incident_type": incident_type
        },
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

    # Langflow v1 response shape: outputs[0].outputs[0].results.message.text
    try:
        text = data["outputs"][0]["outputs"][0]["results"]["message"]["text"]
    except (KeyError, IndexError):
        text = str(data)

    return {"answer": text, "sources": [], "via": "langflow"}


# ── public API ──────────────────────────────────────────────────────────────────

async def answer(query: str, incident_type: str = "general") -> dict:
    """
    Main entry point. Returns:
    {
        "answer": str,
        "sources": [{"section": str, "page": str, "source": str}],
        "via": "langflow" | "direct"
    }
    """
    # Route to Langflow if configured
    if LANGFLOW_URL and LANGFLOW_FLOW_ID:
        return await _call_langflow(query, incident_type)

    # Direct RAG
    try:
        chunks = retrieve(query)
    except Exception as e:
        return {
            "answer": f"Knowledge base not ready. Please ingest a FIFA PDF first. ({e})",
            "sources": [],
            "via": "direct",
        }

    prompt = _build_prompt(query, chunks, incident_type)

    if LLM_PROVIDER == "watsonx":
        text = await _call_watsonx(prompt)
    elif LLM_PROVIDER == "ollama":
        text = await _call_ollama(prompt)
    else:
        text = await _call_openai(prompt)

    sources = [{"section": c["section"], "page": c["page"], "source": c["source"]} for c in chunks]
    return {"answer": text, "sources": sources, "via": "direct"}
