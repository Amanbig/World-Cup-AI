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
from pathlib import Path
from types import SimpleNamespace

import chromadb
import httpx
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from dotenv import load_dotenv

load_dotenv()

# ── config ─────────────────────────────────────────────────────────────────────
CHROMA_DB_PATH    = os.getenv("CHROMA_DB_PATH", str(Path(__file__).parent / "chroma_db"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "fifa_rules")

LLM_PROVIDER       = os.getenv("LLM_PROVIDER", "openai")
OPENAI_API_KEY     = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL       = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL   = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
WATSONX_API_KEY = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL     = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WATSONX_MODEL   = os.getenv("WATSONX_MODEL", "ibm/granite-13b-chat-v2")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.2")

GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL      = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_BASE_URL   = "https://api.groq.com/openai/v1"

LANGFLOW_URL     = os.getenv("LANGFLOW_URL", "")
LANGFLOW_FLOW_ID = os.getenv("LANGFLOW_FLOW_ID", "")
LANGFLOW_API_KEY = os.getenv("LANGFLOW_API_KEY", "")

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


# ── Agent system prompt ──────────────────────────────────────────────────────────

SYSTEM_AGENT = """You are MatchMind, an expert AI football companion for the FIFA World Cup.
You have tools available — use them whenever they add value:

• web_search — search the web (DuckDuckGo) for current football news, recent match results, player transfers, injuries, World Cup standings, or anything time-sensitive.

• search_fifa_rules — look up the FIFA Laws of the Game knowledge base. Use this for any question about rules, regulations, VAR protocol, or official definitions. Always search before answering rule questions so your answers are accurate and cited.

• create_pitch_animation — generate an animated football pitch visualization. Use this whenever showing player positions would help: VAR incidents, offside checks, corner kicks, free kicks, penalties, tactical formations, or any scenario where seeing the pitch adds clarity.

You can chain tools — e.g. web_search for recent context, then search_fifa_rules for the rule, then create_pitch_animation to visualize it.
For simple greetings or conversational messages, respond directly without calling any tools.

PITCH COORDINATE SYSTEM:
- Portrait pitch: x = 0–68 (left→right), y = 0–105 (top→bottom)
- AWAY team defends TOP goal (y≈0): GK y≈5, defenders y≈21–23, mids y≈32–40, forwards y≈48–53
- HOME team defends BOTTOM goal (y≈105): forwards y≈52–57, mids y≈65–73, defenders y≈82–86, GK y≈100
- ALL coordinates strictly within x:0–68, y:0–105

AVAILABLE FORMATIONS: 4-3-3 | 4-4-2 | 4-2-3-1 | 3-5-2 | 5-3-2 | 4-5-1

PLAYER ID GUIDE (ids 1–11 go GK → defenders → midfielders → forwards):
  id=1: GK
  id=2: RB/RWB  id=3: CB  id=4: CB  id=5: LB/LWB
  id=6: CM/CDM  id=7: CM  id=8: CM/CAM
  id=9: RW/RWB  id=10: ST/CF  id=11: LW/ST

HOW TO USE create_pitch_animation (token-efficient format):
1. Pick home_formation and away_formation from the list above.
2. List ALL players under "players.home" and "players.away" with their real names and jersey numbers — do this ONCE.
3. In each frame, only include "moves" for players who actually change position. Players not listed in moves stay exactly where they were.
4. Always include the ball position in every frame.
5. Use the same player IDs consistently across all frames so the animation is smooth.
6. Generate 2–5 frames to tell the full story; label them descriptively ("Build-up", "Through ball", "VAR freeze", etc.)."""

# ── Tool definitions ─────────────────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web via DuckDuckGo for current football news, recent match results, player transfers, injuries, World Cup standings, or anything not covered by the FIFA Laws PDF. Use this for live/recent information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query, e.g. 'World Cup 2026 qualifiers', 'Mbappe injury update', 'Argentina vs France 2022 final highlights'"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_fifa_rules",
            "description": "Search the FIFA Laws of the Game knowledge base for rules, VAR protocol, and official definitions. Use this before answering any rule question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query, e.g. 'offside law 11 body parts', 'VAR review process', 'handball deliberate'"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_pitch_animation",
            "description": "Create an animated football pitch visualization. Specify formations and player names ONCE, then only output moves for players who change position each frame — much more token-efficient than full player arrays.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short scene title shown above the pitch"},
                    "home_formation": {
                        "type": "string",
                        "enum": ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "4-5-1"],
                        "description": "Formation for HOME team (defends BOTTOM goal, y≈105)"
                    },
                    "away_formation": {
                        "type": "string",
                        "enum": ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "4-5-1"],
                        "description": "Formation for AWAY team (defends TOP goal, y≈0)"
                    },
                    "players": {
                        "type": "object",
                        "description": "Player names and jersey numbers for both teams — specified ONCE, not repeated per frame",
                        "properties": {
                            "home": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {"type": "integer", "description": "1–11 matching the formation ID guide"},
                                        "name": {"type": "string"},
                                        "num": {"type": "integer", "description": "Jersey number"}
                                    },
                                    "required": ["id", "name", "num"]
                                }
                            },
                            "away": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "id": {"type": "integer"},
                                        "name": {"type": "string"},
                                        "num": {"type": "integer"}
                                    },
                                    "required": ["id", "name", "num"]
                                }
                            }
                        },
                        "required": ["home", "away"]
                    },
                    "frames": {
                        "type": "array",
                        "description": "2–5 frames. Each frame only lists players who MOVE — everyone else stays put.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "label": {"type": "string"},
                                "ball": {
                                    "type": "object",
                                    "properties": {"x": {"type": "number"}, "y": {"type": "number"}},
                                    "required": ["x", "y"]
                                },
                                "moves": {
                                    "type": "array",
                                    "description": "Only players that change position in this frame",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "team": {"type": "string", "enum": ["home", "away"]},
                                            "id":   {"type": "integer"},
                                            "x":    {"type": "number"},
                                            "y":    {"type": "number"}
                                        },
                                        "required": ["team", "id", "x", "y"]
                                    }
                                }
                            },
                            "required": ["label", "ball", "moves"]
                        }
                    },
                    "offside_y": {
                        "type": "number",
                        "description": "Y-coordinate of the horizontal offside line; omit if not applicable"
                    },
                    "incident_point": {
                        "type": "object",
                        "description": "Location of the key incident; omit if not applicable",
                        "properties": {"x": {"type": "number"}, "y": {"type": "number"}}
                    }
                },
                "required": ["title", "home_formation", "away_formation", "players", "frames"]
            }
        }
    }
]


# ── Tool-calling LLM (non-streaming, decides which tools to use) ─────────────────

def _recover_tool_call(failed: str):
    """
    Some models emit <function=NAME{ARGS}</function> instead of proper tool_calls JSON.
    Parse that format and return a SimpleNamespace that mirrors the OpenAI message object.
    """
    match = re.search(r'<function=(\w+)(\{.*?\})\s*</function>', failed, re.DOTALL)
    if not match:
        return SimpleNamespace(content=None, tool_calls=None)
    tool_name, args_str = match.group(1), match.group(2)
    tc = SimpleNamespace(
        id=f"call_{tool_name}_recovered",
        function=SimpleNamespace(name=tool_name, arguments=args_str),
    )
    return SimpleNamespace(content=None, tool_calls=[tc])


async def _call_with_tools(messages: list[dict]):
    """Call the LLM with tool definitions; returns the raw message object."""
    from openai import AsyncOpenAI, BadRequestError
    if LLM_PROVIDER == "groq":
        client = AsyncOpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)
        model = GROQ_MODEL
    elif LLM_PROVIDER == "openrouter" or OPENROUTER_API_KEY:
        client = AsyncOpenAI(api_key=OPENROUTER_API_KEY, base_url=OPENROUTER_BASE_URL)
        model = OPENROUTER_MODEL
    else:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        model = OPENAI_MODEL
    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.3,
            max_tokens=8000,
        )
        return resp.choices[0].message
    except BadRequestError as e:
        # Model generated a malformed function call (e.g. <function=name{args}</function>).
        # Recover the intended tool call from the failed_generation field.
        body = e.body if isinstance(e.body, dict) else {}
        failed = body.get("error", {}).get("failed_generation", "")
        if failed:
            return _recover_tool_call(failed)
        raise


async def _stream_messages(messages: list[dict]):
    """Stream text chunks from the LLM using a full messages array (no tools)."""
    from openai import AsyncOpenAI
    if LLM_PROVIDER == "groq":
        client = AsyncOpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)
        model = GROQ_MODEL
    elif LLM_PROVIDER == "openrouter" or OPENROUTER_API_KEY:
        client = AsyncOpenAI(api_key=OPENROUTER_API_KEY, base_url=OPENROUTER_BASE_URL)
        model = OPENROUTER_MODEL
    else:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        model = OPENAI_MODEL
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.3,
        max_tokens=2048,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


# ── Legacy single-call LLM helpers (kept for non-Groq fallbacks) ─────────────────

async def _llm(system: str, user: str) -> str:
    if LLM_PROVIDER == "groq":
        return await _call_groq(system, user)
    if LLM_PROVIDER == "watsonx":
        return await _call_watsonx(system, user)
    if LLM_PROVIDER == "ollama":
        return await _call_ollama(system, user)
    if LLM_PROVIDER == "openrouter" or OPENROUTER_API_KEY:
        return await _call_openrouter(system, user)
    return await _call_openai(system, user)


async def _call_openrouter(system: str, user: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENROUTER_API_KEY, base_url=OPENROUTER_BASE_URL)
    resp = await client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
        max_tokens=2048,
    )
    return resp.choices[0].message.content


async def _call_groq(system: str, user: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)
    kwargs = {}
    if system == SYSTEM_VAR:
        kwargs["response_format"] = {"type": "json_object"}
    max_tok = 8000 if system == SYSTEM_VAR else 2048
    resp = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
        max_tokens=max_tok,
        **kwargs,
    )
    return resp.choices[0].message.content


async def _call_openai(system: str, user: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    kwargs = {}
    if system == SYSTEM_VAR:
        kwargs["response_format"] = {"type": "json_object"}
    resp = await client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
        max_tokens=2048,
        **kwargs,
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


async def _stream_groq(system: str, user: str):
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=GROQ_API_KEY, base_url=GROQ_BASE_URL)
    max_tok = 8000 if system == SYSTEM_VAR else 2048
    stream = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
        max_tokens=max_tok,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def _stream_llm(system: str, user: str):
    """Yield text chunks from whichever LLM is configured."""
    if LLM_PROVIDER == "groq":
        async for chunk in _stream_groq(system, user):
            yield chunk
    elif LLM_PROVIDER == "ollama":
        async for chunk in _stream_ollama(system, user):
            yield chunk
    elif LLM_PROVIDER == "watsonx":
        yield await _call_watsonx(system, user)
    elif LLM_PROVIDER == "openrouter" or OPENROUTER_API_KEY:
        async for chunk in _stream_openrouter(system, user):
            yield chunk
    else:
        async for chunk in _stream_openai(system, user):
            yield chunk


async def _stream_openrouter(system: str, user: str):
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=OPENROUTER_API_KEY, base_url=OPENROUTER_BASE_URL)
    stream = await client.chat.completions.create(
        model=OPENROUTER_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.3,
        max_tokens=2048,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


# ── JSON parsing for VAR responses ──────────────────────────────────────────────

def _parse_var_response(raw: str) -> dict:
    """
    Extract and validate the JSON object from the LLM's VAR response.
    Handles truncated JSON by recovering complete frames already generated.
    """
    raw = re.sub(r"```(?:json)?", "", raw).strip()

    # 1. Try clean parse first
    try:
        data = json.loads(raw)
        return {
            "answer": data.get("answer", ""),
            "match": data.get("match"),
            "visualization": data.get("visualization"),
        }
    except json.JSONDecodeError:
        pass

    # 2. JSON was likely truncated — try to recover what we can
    # Extract the "answer" text field
    answer_match = re.search(r'"answer"\s*:\s*"((?:[^"\\]|\\.)*)"', raw)
    answer_text = answer_match.group(1).encode().decode("unicode_escape") if answer_match else ""

    # Extract complete frame objects (each ends with a closing "}" before the next frame or end)
    frames = []
    for fm in re.finditer(r'\{\s*"label"\s*:.*?"away"\s*:\s*\[.*?\]\s*\}', raw, re.DOTALL):
        try:
            frame = json.loads(fm.group())
            frames.append(frame)
        except json.JSONDecodeError:
            pass

    # Extract match block
    match_data = None
    match_m = re.search(r'"match"\s*:\s*(\{[^}]+\})', raw)
    if match_m:
        try:
            match_data = json.loads(match_m.group(1))
        except json.JSONDecodeError:
            pass

    viz = None
    if frames:
        title_m = re.search(r'"title"\s*:\s*"([^"]+)"', raw)
        viz = {
            "title": title_m.group(1) if title_m else "Incident replay",
            "frames": frames,
            "offside_y": None,
            "incident_point": None,
        }
        oy = re.search(r'"offside_y"\s*:\s*([0-9.]+)', raw)
        if oy:
            viz["offside_y"] = float(oy.group(1))
        ip = re.search(r'"incident_point"\s*:\s*\{[^}]+\}', raw)
        if ip:
            try:
                viz["incident_point"] = json.loads(ip.group().split(":", 1)[1].strip())
            except Exception:
                pass

    # If we couldn't recover anything useful, return raw as plain text answer
    if not answer_text and not frames:
        return {"answer": raw, "match": None, "visualization": None}

    return {"answer": answer_text or "VAR analysis complete.", "match": match_data, "visualization": viz}


# ── Langflow path ────────────────────────────────────────────────────────────────

async def _call_langflow(query: str, incident_type: str) -> dict:
    url = f"{LANGFLOW_URL}/api/v1/run/{LANGFLOW_FLOW_ID}"
    payload = {
        "input_value": query,
        "input_type": "chat",
        "output_type": "chat",
        "tweaks": {"incident_type": incident_type},
    }
    headers = {}
    if LANGFLOW_API_KEY:
        headers["x-api-key"] = LANGFLOW_API_KEY
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload, headers=headers)
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
    Agentic streaming answer.
    The LLM decides autonomously whether to call search_fifa_rules and/or
    create_pitch_animation based on the query.  The frontend still receives
    the same SSE envelope:
      data: {"type":"chunk","text":"..."}
      data: {"type":"done","sources":[...],"match_info":null,"viz_data":...}
    """
    def sse(obj: dict) -> str:
        return f"data: {json.dumps(obj)}\n\n"

    # ── Langflow fast-path (unchanged) ──────────────────────────────────────────
    if LANGFLOW_URL and LANGFLOW_FLOW_ID:
        try:
            result = await _call_langflow(query, incident_type)
            yield sse({"type": "chunk", "text": result["answer"]})
        except Exception as e:
            yield sse({"type": "chunk", "text": f"LLM error: {e}"})
        yield sse({"type": "done", "sources": [], "match_info": None, "viz_data": None})
        return

    # ── Build initial messages ──────────────────────────────────────────────────
    hint = ""
    if incident_type == "var":
        hint = "\n\n[Hint: the user wants to see a pitch animation for this scenario.]"
    elif incident_type == "tactical":
        hint = "\n\n[Hint: this is a tactical question — a pitch animation may help illustrate formations or movement.]"

    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_AGENT},
        {"role": "user",   "content": query + hint},
    ]

    viz_data: dict | None = None
    sources: list[dict] = []

    # ── Agentic tool-calling loop (max 4 rounds) ────────────────────────────────
    for _ in range(4):
        try:
            msg = await _call_with_tools(messages)
        except Exception as e:
            yield sse({"type": "chunk", "text": f"[LLM error: {e}]"})
            yield sse({"type": "done", "sources": sources, "match_info": None, "viz_data": viz_data})
            return

        tool_calls = getattr(msg, "tool_calls", None) or []

        if not tool_calls:
            # LLM chose to respond directly (no tools needed) — stream its content now
            text = msg.content or ""
            if text:
                # Stream word by word for typewriter feel
                words = text.split(" ")
                for i, word in enumerate(words):
                    yield sse({"type": "chunk", "text": word + ("" if i == len(words) - 1 else " ")})
            yield sse({"type": "done", "sources": sources, "match_info": None, "viz_data": viz_data})
            return

        # Append the assistant's tool-call message
        messages.append({
            "role": "assistant",
            "content": msg.content,
            "tool_calls": [
                {"id": tc.id, "type": "function",
                 "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                for tc in tool_calls
            ],
        })

        # Execute each tool
        for tc in tool_calls:
            name = tc.function.name
            try:
                args = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                args = {}

            if name == "web_search":
                q = args.get("query", query)
                yield sse({"type": "tool_status", "tool": "web_search", "label": f'🌐 Searching web for "{q}"…'})
                try:
                    from duckduckgo_search import DDGS
                    results = []
                    with DDGS() as ddgs:
                        for r in ddgs.text(q, max_results=5):
                            results.append(r)
                    if results:
                        tool_result = "\n\n".join(
                            f"[{i+1}] {r.get('title','')}\n{r.get('href','')}\n{r.get('body','')}"
                            for i, r in enumerate(results)
                        )
                        yield sse({"type": "tool_status", "tool": "web_search", "label": f"✅ Found {len(results)} web results"})
                    else:
                        tool_result = "No results found."
                        yield sse({"type": "tool_status", "tool": "web_search", "label": "⚠️ No web results found"})
                except Exception as e:
                    tool_result = f"Web search error: {e}"
                    yield sse({"type": "tool_status", "tool": "web_search", "label": f"❌ Web search failed: {e}"})

            elif name == "search_fifa_rules":
                q = args.get("query", query)
                yield sse({"type": "tool_status", "tool": "search_fifa_rules", "label": f'🔍 Searching FIFA rules for "{q}"…'})
                try:
                    rule_chunks = retrieve(q)
                    sources = [{"section": c["section"], "page": c["page"], "source": c["source"]}
                               for c in rule_chunks]
                    context = "\n\n".join(
                        f"[Source {i+1}] Section: {c['section']} | Page: {c['page']}\n{c['text']}"
                        for i, c in enumerate(rule_chunks)
                    )
                    tool_result = f"FIFA rules retrieved:\n\n{context}"
                    yield sse({"type": "tool_status", "tool": "search_fifa_rules", "label": f"✅ Found {len(rule_chunks)} relevant rule sections"})
                except Exception as e:
                    tool_result = f"Knowledge base error: {e}"
                    yield sse({"type": "tool_status", "tool": "search_fifa_rules", "label": f"❌ Knowledge base error: {e}"})

            elif name == "create_pitch_animation":
                yield sse({"type": "tool_status", "tool": "create_pitch_animation", "label": "📺 Generating pitch animation…"})
                viz_data = {
                    "title":           args.get("title", ""),
                    "home_formation":  args.get("home_formation", "4-3-3"),
                    "away_formation":  args.get("away_formation", "4-4-2"),
                    "players":         args.get("players", {"home": [], "away": []}),
                    "frames":          args.get("frames", []),
                    "offside_y":       args.get("offside_y"),
                    "incident_point":  args.get("incident_point"),
                }
                n_frames = len(viz_data["frames"])
                tool_result = "Pitch animation created. Now write your text explanation."
                yield sse({"type": "tool_status", "tool": "create_pitch_animation", "label": f"✅ Animation ready — {n_frames} frames"})

            else:
                tool_result = f"Unknown tool: {name}"

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": tool_result,
            })

    # ── Tools were used — stream the final text answer ──────────────────────────
    # (only reached when the LLM called at least one tool and needs to explain)
    try:
        async for chunk in _stream_messages(messages):
            yield sse({"type": "chunk", "text": chunk})
    except Exception as e:
        yield sse({"type": "chunk", "text": f"\n\n[Stream error: {e}]"})

    yield sse({"type": "done", "sources": sources, "match_info": None, "viz_data": viz_data})
