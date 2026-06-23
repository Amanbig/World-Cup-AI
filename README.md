# MatchMind — AI World Cup Companion

> Explain VAR decisions, animate player positions, and break down FIFA Laws of the Game — powered by Docling + Langflow.

Built for the **IBM & FIFA World Cup AI Hackathon**.

---

## What it does

**MatchMind** is a three-panel football intelligence app:

| Panel | Purpose |
|-------|---------|
| **Scoreboard** (left) | Live or historical match context — teams, score, clock, VAR incident timeline |
| **Pitch** (center) | Animated player dots showing formations and movement across VAR review frames |
| **AI Chat** (right) | Streaming answers that cite specific FIFA Laws, with match-specific suggested questions |

**Three modes:**
- **VAR Decision** — ask about any offside, handball, foul or penalty review; the AI returns a structured JSON response that animates the pitch
- **Tactical Analysis** — formation breakdowns, pressing systems, substitution logic
- **Rule Question** — any FIFA Law of the Game question, grounded in the ingested PDF

**Historical match selector** — pick any match from 2014/2018/2022 World Cups and get match-specific suggested questions pre-loaded (e.g. "Argentina had three goals disallowed by VAR vs Saudi Arabia — show the offside lines").

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | FastAPI + Uvicorn |
| PDF ingestion | **Docling** — structured PDF → chunks |
| Vector store | ChromaDB + `all-MiniLM-L6-v2` embeddings |
| RAG pipeline | **Langflow** (visual) or direct in-process |
| LLM | OpenAI GPT-4o-mini / IBM WatsonX Granite / Ollama |
| Pitch viz | CSS `position: absolute` dots + SVG markings, animated with `transition` |
| Streaming | Server-Sent Events (SSE) — tokens stream live to the chat |
| Container | Docker multi-stage build + Docker Compose |

---

## Project structure

```
matchmind/
├── src/                        # React frontend
│   ├── components/
│   │   ├── PitchView.tsx       # Animated pitch with player dots
│   │   ├── MatchSidebar.tsx    # Scoreboard + events timeline
│   │   ├── IncidentSelector.tsx # Mode tabs + match selector dropdown
│   │   └── ChatMessage.tsx     # Message bubbles with streaming cursor
│   ├── data/
│   │   └── matches.ts          # Historical match data + suggested queries
│   ├── types.ts
│   ├── App.tsx
│   └── App.css
├── backend/
│   ├── main.py                 # FastAPI app — API routes + static file serving
│   ├── rag.py                  # RAG logic, LLM calls, SSE streaming
│   ├── ingest.py               # Docling PDF → ChromaDB pipeline
│   └── requirements.txt
├── Dockerfile                  # Multi-stage: Node builds frontend → Python serves everything
├── docker-compose.yml          # app + langflow services
├── .env.example
└── vite.config.ts              # Dev proxy: /api → localhost:8000
```

---

## Quick start

### Option A — Docker Compose (recommended)

Everything runs in containers: the app, Langflow, and persistent volumes for ChromaDB and Langflow data.

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env — set OPENAI_API_KEY (or configure Ollama/WatsonX)

# 2. Build and start
docker compose up --build
```

| Service | URL |
|---------|-----|
| MatchMind app | http://localhost:8000 |
| Langflow editor | http://localhost:7860 |

> **First build takes ~5 minutes** — the Dockerfile pre-downloads the `all-MiniLM-L6-v2` embedding model so the first PDF ingest is fast.

---

### Option B — Local development

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # fill in keys
uvicorn main:app --reload --port 8000
```

**Frontend** (separate terminal)
```bash
npm install
npm run dev      # Vite proxy forwards /api → localhost:8000
```

Open http://localhost:5173

---

## Ingest a FIFA PDF

1. Click **"Upload FIFA PDF to start"** in the top-right of the app
2. Upload the [FIFA Laws of the Game PDF](https://www.theifab.com/laws-of-the-game-documents/) (or any match report)
3. Docling parses it into structured chunks → ChromaDB stores embeddings
4. The status pill turns green with the chunk count — you're ready to ask questions

---

## Langflow setup

Langflow lets you visually build and tweak the RAG pipeline without touching code. The flow is:

```
ChatInput → Chroma retriever → Prompt template → LLM → ChatOutput
```

### Option A — auto-create (recommended)

A script uploads the pre-built flow directly to your Langflow instance:

```bash
# With Docker Compose running:
cd langflow
pip install requests python-dotenv
python create_flow.py

# Or point at a custom URL:
python create_flow.py --url http://localhost:7860 --model gpt-4o-mini
```

The script prints the Flow ID and the exact lines to add to `.env`:
```
Flow ID : xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

Add these to your .env:
  LANGFLOW_URL=http://localhost:7860
  LANGFLOW_FLOW_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Then restart the app:
```bash
docker compose restart app
```

### Option B — manual import

The script also saves `langflow/matchmind_flow.json`. Import it via the Langflow UI:

1. Open http://localhost:7860
2. Click **Import** (top right) → select `langflow/matchmind_flow.json`
3. Click **API** tab on the flow → copy the **Flow ID**
4. Add to `.env` and restart

### What the flow does

| Node | Role |
|------|------|
| **ChatInput** | Receives the user's question |
| **Chroma** | Queries the `fifa_rules` vector store (built by Docling ingest) and returns top-5 chunks |
| **Prompt** | Injects retrieved context + question into the MatchMind system prompt |
| **OpenAI / Granite** | Generates the answer, citing specific FIFA Laws |
| **ChatOutput** | Returns the response to the backend |

> If `LANGFLOW_FLOW_ID` is not set, the app falls back to the built-in in-process RAG path automatically — so Langflow is optional.

---

## LLM configuration

Set `LLM_PROVIDER` in `.env` to switch providers:

### OpenAI (default)
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### Ollama (local, no API key)
```bash
ollama pull llama3.2
```
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434   # from inside Docker
OLLAMA_MODEL=llama3.2
```

### IBM WatsonX Granite
```env
LLM_PROVIDER=watsonx
WATSONX_API_KEY=...
WATSONX_PROJECT_ID=...
WATSONX_MODEL=ibm/granite-13b-chat-v2
```

---

## How VAR mode works

1. User types a question (e.g. *"Argentina had 3 goals disallowed vs Saudi Arabia — show the offside lines"*)
2. Backend retrieves relevant FIFA Law chunks from ChromaDB
3. LLM is prompted with `SYSTEM_VAR` — a structured JSON schema requiring:
   - `answer` — cited explanation
   - `match` — extracted teams, minute, incident type
   - `visualization.frames` — player positions in portrait pitch coordinates (x: 0–68, y: 0–105)
   - `offside_y` — y-coordinate of the horizontal offside line
4. Response streams back via SSE — chat updates token by token
5. When the `done` event fires, the pitch animates player dots across frames with CSS transitions

---

## Pitch coordinate system

```
  y=0  ┌──────────────────┐  Away team defends top goal
       │   Away players   │  GK ≈ y=5, defenders y=15–25
       │                  │
 y=52.5├──────── ○ ───────┤  Centre line
       │                  │
       │   Home players   │  forwards y=55–65, GK ≈ y=100
  y=105└──────────────────┘  Home team defends bottom goal
       x=0              x=68
```

Player dots use `position: absolute` with `left`/`top` as percentages so they scale to any pitch size. CSS `transition: 0.7s cubic-bezier` animates movement between frames.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | `openai` / `ollama` / `watsonx` |
| `OPENAI_API_KEY` | — | Required if using OpenAI |
| `OPENAI_MODEL` | `gpt-4o-mini` | Any chat model |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3.2` | Any Ollama model |
| `WATSONX_API_KEY` | — | IBM WatsonX API key |
| `WATSONX_PROJECT_ID` | — | WatsonX project ID |
| `LANGFLOW_URL` | — | Langflow server URL (e.g. `http://localhost:7860`) |
| `LANGFLOW_FLOW_ID` | — | Flow ID from Langflow UI |
| `CHROMA_DB_PATH` | `./chroma_db` | ChromaDB persistence path |
| `CHROMA_COLLECTION` | `fifa_rules` | Collection name |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |

---

## Historical match data

The app ships with suggested VAR questions for 20+ matches across three World Cups:

- **2022 Qatar** — Final (ARG vs FRA), all QF/SF, group stage upsets (ARG vs KSA)
- **2018 Russia** — Final (FRA vs CRO), R16 (ARG vs FRA), Spain vs Russia
- **2014 Brazil** — Final (GER vs ARG), semi-final (BRA 1–7 GER), QF incidents

Select any match from the dropdown in the top bar → the scoreboard pre-fills with real teams and the chat shows match-specific questions ready to fire.

---

## License

MIT
