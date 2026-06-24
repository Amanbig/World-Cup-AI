# MatchMind — Langflow Setup

Two ways to get the flow into Langflow: **script** (automated) or **manual import**.

---

## Option A — Script (automated)

```bash
cd langflow/
python3 create_flow.py
```

The script builds the flow JSON, saves it as `matchmind_flow.json`, then uploads it to your running Langflow instance.

**Requirements in `langflow/.env`:**

```env
LANGFLOW_API_KEY=sk-...        # from Langflow UI → Settings → API Keys
LANGFLOW_URL=http://localhost:7860   # optional, this is the default
OPENAI_API_KEY=sk-...          # needed by the LLM node at runtime
```

On success it prints the `LANGFLOW_FLOW_ID` — copy that into your root `.env`.

---

## Option B — Build the flow by hand in the UI

### 1. Start Langflow

```bash
# Docker
docker compose up langflow

# or local install
langflow run
```

Open [http://localhost:7860](http://localhost:7860) in your browser.

### 2. Create a blank flow

1. Click **"New Flow"** → **"Blank Flow"**.
2. Give it the name **MatchMind RAG**.

---

### 3. Add and configure each node

Add nodes from the left sidebar (search by name). Lay them out left → right in this order:

```
[ChatInput] → [Chroma] → [Prompt] → [OpenAI] → [ChatOutput]
```

---

#### Node 1 — ChatInput

- Search: `Chat Input`
- Drag onto the canvas (left side)
- Settings:
  | Field | Value |
  |-------|-------|
  | Display Name | `User Question` |
  | Message | *(leave blank — user types here at runtime)* |

---

#### Node 2 — Chroma

- Search: `Chroma`
- Drag onto the canvas (centre-left)
- Settings:
  | Field | Value |
  |-------|-------|
  | Display Name | `FIFA Rules Chroma` |
  | Collection Name | `fifa_rules` |
  | Persist Directory | `/absolute/path/to/your/chroma_db` (where `ingest.py` wrote the DB) |
  | Number of Results (Top-K) | `5` |
  | Search Type | `Similarity` |
  | Embedding Model | `all-MiniLM-L6-v2` |

---

#### Node 3 — Prompt

- Search: `Prompt`
- Drag onto the canvas (centre)
- Settings:
  | Field | Value |
  |-------|-------|
  | Display Name | `MatchMind Prompt` |
  | Template | paste the text below |

**Template to paste:**

```
You are MatchMind, an expert FIFA Laws of the Game companion for the World Cup.
Explain VAR decisions, tactical shifts, and football rules with precision.
Always cite the specific FIFA Law (e.g. 'Law 11 – Offside').
Base your answer only on the retrieved context below.

Context from FIFA documents:
{context}

Question: {question}

Answer:
```

> The `{context}` and `{question}` placeholders become the input handles on the node.

---

#### Node 4 — OpenAI

- Search: `OpenAI`
- Drag onto the canvas (centre-right)
- Settings:
  | Field | Value |
  |-------|-------|
  | Display Name | `LLM (OpenAI / Granite)` |
  | Model Name | `gpt-4o-mini` |
  | Temperature | `0.3` |
  | Max Tokens | `1024` |
  | OpenAI API Key | your `OPENAI_API_KEY` value |

---

#### Node 5 — ChatOutput

- Search: `Chat Output`
- Drag onto the canvas (right side)
- Settings:
  | Field | Value |
  |-------|-------|
  | Display Name | `Answer` |

---

### 4. Connect the nodes (draw the edges)

Click and drag from an **output handle** to an **input handle**:

| From node | Output handle | To node | Input handle |
|-----------|--------------|---------|--------------|
| ChatInput | `text` | Chroma | `search_query` |
| ChatInput | `text` | Prompt | `question` |
| Chroma | `results` | Prompt | `context` |
| Prompt | `prompt` | OpenAI | `prompt` |
| OpenAI | `text` | ChatOutput | `input_value` |

---

### 5. Get the Flow ID

After saving, the Flow ID is the UUID in the browser URL:  
`http://localhost:7860/flow/<FLOW_ID>`

Or fetch it via API:

```bash
curl -s http://localhost:7860/api/v1/flows/ \
  -H "x-api-key: $LANGFLOW_API_KEY" | python3 -m json.tool | grep '"id"'
```

### 6. Add the Flow ID to your root `.env`

```env
LANGFLOW_URL=http://localhost:7860
LANGFLOW_FLOW_ID=<paste-uuid-here>
```

Then restart the app:

```bash
docker compose restart app
```

---

## Chroma DB

The Chroma vector store must be ingested **before** running the flow.  
From the project root:

```bash
python3 ingest.py
```

This reads the FIFA PDFs, chunks them, embeds with `all-MiniLM-L6-v2`, and writes to `./chroma_db/`.  
Point the Chroma node's **Persist Directory** to that same path.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `401 Unauthorized` | API key is wrong or expired — regenerate in Langflow UI → Settings → API Keys |
| `403 Forbidden` | API key doesn't have flow-create permissions |
| `405 Method Not Allowed` | Endpoint missing trailing slash (already fixed in script) |
| Chroma node returns no results | Run `ingest.py` first; check collection name matches |
| LLM node fails | Verify `OPENAI_API_KEY` is set in the node or env |
