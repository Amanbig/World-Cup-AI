"""
RAG (Retrieval-Augmented Generation) layer.

Two execution paths:
  1. Langflow path  – if LANGFLOW_URL + LANGFLOW_FLOW_ID are set, the query is
                      forwarded to a running Langflow instance.
  2. Direct path    – in-process retrieval from ChromaDB + LLM call.
                      Works with OpenAI, IBM WatsonX (Granite), or Ollama.

For VAR queries the LLM is instructed to return structured JSON that includes
a text explanation, extracted match metadata, and player-position frames for
the pitch visualisation on the frontend.
"""

import json
import os
import re

import chromadb
import httpx
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from dotenv import load_dotenv

load_dotenv()

# ── config ─────────────────────────────────────────────────────────────────────
CHROMA_DB_PATH    = os.getenv("CHROMA_DB_PATH", "./chroma_db")
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "fifa_rules")

LLM_PROVIDER    = os.getenv("LLM_PROVIDER", "openai")
OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL    = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
WATSONX_API_KEY = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL     = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WATSONX_MODEL   = os.getenv("WATSONX_MODEL", "ibm/granite-13b-chat-v2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.2")

LANGFLOW_URL     = os.getenv("LANGFLOW_URL", "")
LANGFLOW_FLOW_ID = os.getenv("LANGFLOW_FLOW_ID", "")

TOP_K = 5

# ── retrieval ───────────────────────────────────────────────────────────────────

def _get_collection():
    embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    return client.get_collection(CHROMA_COLLECTION, embedding_function=embed_fn)


def retrieve(query: str, top_k: int = TOP_K) -> list[dict]:
    col = _get_collection()
    results = col.query(query_texts=[query], n_results=top_k)
    chunks = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        chunks.append({
            "text": doc,
            "section": meta.get("section", ""),
            "page": meta.get("page", "?"),
            "source": meta.get("source", ""),
        })
    return chunks


# ── prompts ─────────────────────────────────────────────────────────────────────

SYSTEM_GENERAL = """You are MatchMind, an expert FIFA Laws of the Game companion for the World Cup.
Explain rules, tactical shifts, and football concepts clearly.
Always cite the specific Law or section (e.g. "Law 11 – Offside").
Base your answer on the retrieved context below. Do not invent rules."""

# VAR system prompt asks for a structured JSON response that includes both the
# explanation text AND player-position data for the pitch visualisation.
SYSTEM_VAR = """You are MatchMind, an expert FIFA Laws of the Game companion.
For this VAR decision query, return ONLY a valid JSON object — no markdown fences, no preamble.

Schema:
{
  "answer": "<detailed plain-language explanation citing the specific FIFA Law>",
  "match": {
    "home_team": "<team name if mentioned, else null>",
    "away_team": "<team name if mentioned, else null>",
    "minute": <integer or null>,
    "incident": "<offside|handball|foul|penalty|generic>"
  },
  "visualization": {
    "title": "<one-line description of the play, e.g. 'Offside trap — attacker caught behind last defender'>",
    "frames": [
      {
        "label": "<short label, e.g. 'Before pass'>",
        "ball": {"x": <0-105>, "y": <0-68>},
        "home": [{"id": 1, "x": <0-105>, "y": <0-68>, "pos": "<ST|CM|LB|etc>"}],
        "away": [{"id": 1, "x": <0-105>, "y": <0-68>, "pos": "<CB|GK|etc>"}]
      }
    ],
    "offside_x": <x-coordinate of offside line or null>,
    "incident_point": {"x": <0-105>, "y": <0-68>} or null
  }
}

COORDINATE SYSTEM:
- x=0 is the LEFT goal line, x=105 is the RIGHT goal line
- y=0 is the TOP touchline, y=68 is the BOTTOM touchline
- Home team attacks LEFT → RIGHT (home players cluster around x=30-60)
- Away team defends their RIGHT goal (away defenders cluster around x=55-80, GK at x=90-103)
- Include 3-6 players per team — only those relevant to the incident
- Provide 2-4 frames showing the progression of the play

For offside: show the last defender's x as offside_x; frame 1 = before pass (attacker behind line), frame 2 = at pass (attacker beyond line).
For handball: show ball trajectory across frames; incident_point = where contact occurred.
For foul: incident_point = foul location; show attacker + fouling defender at that spot."""

INCIDENT_PREFIXES = {
    "tactical": "This is a TACTICAL ANALYSIS question. Explain the tactical reasoning and expected outcome.",
    "general":  "This is a GENERAL RULE question. Explain the rule clearly with any relevant examples.",
}


def _build_prompt(query: str, chunks: list[dict], incident_type: str) -> str:
    context = "\n\n".join(
        f"[Source {i+1}] Section: {c['section']} | Page: {c['page']}\n{c['text']}"
        for i, c in enumerate(chunks)
    )
    prefix = INCIDENT_PREFIXES.get(incident_type, "")
    return f"{prefix}\n\nRelevant rules from FIFA Laws of the Game:\n\n{context}\n\nQuestion: {query}"


# ── LLM calls ───────────────────────────────────────────────────────────────────

async def _llm(system: str, user: str) -> str:
    if LLM_PROVIDER == "watsonx":
        return await _call_watsonx(system, user)
    if LLM_PROVIDER == "ollama":
        return await _call_ollama(system, user)
    return await _call_openai(system, user)


async def _call_openai(system: str, user: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    resp = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
        max_tokens=2048,
        response_format={"type": "json_object"} if system == SYSTEM_VAR else None,
    )
    return resp.choices[0].message.content


async def _call_watsonx(system: str, user: str) -> str:
    import ibm_watsonx_ai.foundation_models as fm
    from ibm_watsonx_ai import Credentials
    creds = Credentials(url=WATSONX_URL, api_key=WATSONX_API_KEY)
    model = fm.ModelInference(
        model_id=WATSONX_MODEL,
        credentials=creds,
        project_id=WATSONX_PROJECT,
        params={fm.schema.TextChatParameters.TEMPERATURE: 0.3, fm.schema.TextChatParameters.MAX_TOKENS: 2048},
    )
    resp = model.chat(messages=[{"role": "system", "content": system}, {"role": "user", "content": user}])
    return resp["choices"][0]["message"]["content"]


async def _call_ollama(system: str, user: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                "stream": False,
                "format": "json" if system == SYSTEM_VAR else None,
            },
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]


# ── JSON parsing for VAR responses ──────────────────────────────────────────────

def _parse_var_response(raw: str) -> dict:
    """
    Extract and validate the JSON object from the LLM's VAR response.
    Falls back gracefully if the LLM returns imperfect output.
    """
    # Strip markdown fences if the model included them despite instructions
    raw = re.sub(r"```(?:json)?", "", raw).strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # Try to find the first {...} block
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            try:
                data = json.loads(m.group())
            except Exception:
                return {"answer": raw, "match": None, "visualization": None}
        else:
            return {"answer": raw, "match": None, "visualization": None}

    return {
        "answer": data.get("answer", raw),
        "match": data.get("match"),
        "visualization": data.get("visualization"),
    }


# ── Langflow path ────────────────────────────────────────────────────────────────

async def _call_langflow(query: str, incident_type: str) -> dict:
    url = f"{LANGFLOW_URL}/api/v1/run/{LANGFLOW_FLOW_ID}"
    payload = {
        "input_value": query,
        "input_type": "chat",
        "output_type": "chat",
        "tweaks": {"incident_type": incident_type},
    }
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    try:
        text = data["outputs"][0]["outputs"][0]["results"]["message"]["text"]
    except (KeyError, IndexError):
        text = str(data)
    return {"answer": text, "sources": [], "match_info": None, "viz_data": None, "via": "langflow"}


# ── public API ───────────────────────────────────────────────────────────────────

async def answer(query: str, incident_type: str = "general") -> dict:
    """
    Returns:
    {
        "answer":     str,
        "sources":    [{"section", "page", "source"}],
        "match_info": dict | None,   # extracted match metadata (VAR only)
        "viz_data":   dict | None,   # player-position frames for pitch view (VAR only)
        "via":        "langflow" | "direct"
    }
    """
    if LANGFLOW_URL and LANGFLOW_FLOW_ID:
        return await _call_langflow(query, incident_type)

    try:
        chunks = retrieve(query)
    except Exception as e:
        return {
            "answer": f"Knowledge base not ready — please ingest a FIFA PDF first. ({e})",
            "sources": [], "match_info": None, "viz_data": None, "via": "direct",
        }

    sources = [{"section": c["section"], "page": c["page"], "source": c["source"]} for c in chunks]

    if incident_type == "var":
        # Build a user message that combines retrieved context with the query
        context = "\n\n".join(
            f"[Source {i+1}] Section: {c['section']} | Page: {c['page']}\n{c['text']}"
            for i, c in enumerate(chunks)
        )
        user_msg = (
            f"Relevant FIFA rules context:\n\n{context}\n\n"
            f"VAR decision question: {query}"
        )
        raw = await _llm(SYSTEM_VAR, user_msg)
        parsed = _parse_var_response(raw)
        return {
            "answer":     parsed["answer"],
            "sources":    sources,
            "match_info": parsed.get("match"),
            "viz_data":   parsed.get("visualization"),
            "via":        "direct",
        }
    else:
        user_msg = _build_prompt(query, chunks, incident_type)
        text = await _llm(SYSTEM_GENERAL, user_msg)
        return {
            "answer": text,
            "sources": sources,
            "match_info": None,
            "viz_data": None,
            "via": "direct",
        }
