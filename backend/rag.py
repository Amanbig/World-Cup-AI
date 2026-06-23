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

# VAR system prompt — portrait pitch coords, jersey numbers, player names.
SYSTEM_VAR = """You are MatchMind, an expert FIFA Laws of the Game companion.
For this VAR decision query return ONLY a valid JSON object — no markdown, no preamble.

PORTRAIT PITCH COORDINATE SYSTEM (very important — read carefully):
- The pitch is displayed VERTICALLY (portrait): x = 0–68 (left→right), y = 0–105 (top→bottom)
- AWAY team defends the TOP goal (y=0). Away players occupy y = 0–52.
    Away GK:        x≈34, y≈5
    Away defenders: y≈15–25, spread x≈10–58
    Away midfield:  y≈28–40, spread x≈10–58
    Away forwards:  y≈42–52, spread x≈10–58
- HOME team defends the BOTTOM goal (y=105). Home players occupy y = 53–105.
    Home forwards:  y≈55–65, spread x≈10–58
    Home midfield:  y≈65–78, spread x≈10–58
    Home defenders: y≈80–92, spread x≈10–58
    Home GK:        x≈34, y≈100
- offside_y is the Y-coordinate of the HORIZONTAL offside line (not x).
- incident_point uses the same portrait (x, y) system.

JSON schema:
{
  "answer": "<detailed explanation citing the specific FIFA Law, e.g. Law 11>",
  "match": {
    "home_team": "<team name or null>",
    "away_team": "<team name or null>",
    "minute": <integer or null>,
    "incident": "offside" | "handball" | "foul" | "penalty" | "generic"
  },
  "visualization": {
    "title": "<one-line scene description>",
    "frames": [
      {
        "label": "<frame label, e.g. 'Before pass' / 'At offside moment'>",
        "ball": {"x": <0-68>, "y": <0-105>},
        "home": [
          {"id": 1, "x": <0-68>, "y": <0-105>, "pos": "ST", "num": 9, "name": "Surname"}
        ],
        "away": [
          {"id": 1, "x": <0-68>, "y": <0-105>, "pos": "CB", "num": 4, "name": "Surname"}
        ]
      }
    ],
    "offside_y": <y-coord of horizontal offside line, or null>,
    "incident_point": {"x": <0-68>, "y": <0-105>} or null
  }
}

RULES:
- Include 4–6 players per team showing a realistic formation shape.
- Use REAL player names/numbers if the teams are well-known (e.g. World Cup 2022 Final).
- For offside: frame 1 = before pass (attacker onside), frame 2 = at pass (attacker beyond offside_y line).
- For handball: show ball trajectory across frames; incident_point = contact location.
- For foul: incident_point = foul spot; show attacker + defender at that location.
- Keep player ids STABLE across frames so CSS transitions animate the movement correctly."""

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


# ── LLM calls (batch) ───────────────────────────────────────────────────────────

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


# ── LLM streaming ────────────────────────────────────────────────────────────────

async def _stream_openai(system: str, user: str):
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    stream = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
        max_tokens=2048,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def _stream_ollama(system: str, user: str):
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                "stream": True,
            },
        ) as resp:
            async for line in resp.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                except json.JSONDecodeError:
                    pass


async def _stream_llm(system: str, user: str):
    """Yield text chunks from whichever LLM is configured."""
    if LLM_PROVIDER == "ollama":
        async for chunk in _stream_ollama(system, user):
            yield chunk
    elif LLM_PROVIDER == "watsonx":
        # WatsonX batch → emit as single chunk
        yield await _call_watsonx(system, user)
    else:
        async for chunk in _stream_openai(system, user):
            yield chunk


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

async def stream_answer(query: str, incident_type: str = "general"):
    """
    Async generator yielding SSE lines.
      data: {"type":"chunk","text":"..."}
      data: {"type":"done","sources":[...],"match_info":...,"viz_data":...}
      data: {"type":"error","message":"..."}
    """
    def sse(obj: dict) -> str:
        return f"data: {json.dumps(obj)}\n\n"

    if LANGFLOW_URL and LANGFLOW_FLOW_ID:
        result = await _call_langflow(query, incident_type)
        yield sse({"type": "chunk", "text": result["answer"]})
        yield sse({"type": "done", "sources": [], "match_info": None, "viz_data": None})
        return

    try:
        chunks = retrieve(query)
    except Exception as e:
        yield sse({"type": "chunk", "text": f"Knowledge base not ready — please ingest a FIFA PDF first. ({e})"})
        yield sse({"type": "done", "sources": [], "match_info": None, "viz_data": None})
        return

    sources = [{"section": c["section"], "page": c["page"], "source": c["source"]} for c in chunks]

    if incident_type == "var":
        # VAR needs full JSON before we can parse — collect, parse, then stream the answer text
        context = "\n\n".join(
            f"[Source {i+1}] Section: {c['section']} | Page: {c['page']}\n{c['text']}"
            for i, c in enumerate(chunks)
        )
        user_msg = (
            f"Relevant FIFA rules context:\n\n{context}\n\n"
            f"VAR decision question: {query}"
        )
        raw_parts = []
        async for chunk in _stream_llm(SYSTEM_VAR, user_msg):
            raw_parts.append(chunk)
        raw = "".join(raw_parts)
        parsed = _parse_var_response(raw)

        # Stream the answer word by word for a natural typewriter feel
        words = parsed["answer"].split(" ")
        for i, word in enumerate(words):
            yield sse({"type": "chunk", "text": word + ("" if i == len(words) - 1 else " ")})

        yield sse({
            "type": "done",
            "sources": sources,
            "match_info": parsed.get("match"),
            "viz_data": parsed.get("visualization"),
        })
    else:
        user_msg = _build_prompt(query, chunks, incident_type)
        async for chunk in _stream_llm(SYSTEM_GENERAL, user_msg):
            yield sse({"type": "chunk", "text": chunk})
        yield sse({"type": "done", "sources": sources, "match_info": None, "viz_data": None})


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
