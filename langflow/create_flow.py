"""
Creates and uploads the MatchMind RAG flow to a running Langflow instance.

Prerequisites:
  pip install langflow requests
  langflow run   (starts Langflow on http://localhost:7860)

Usage:
  python create_flow.py
  # Outputs the FLOW_ID to paste into backend/.env as LANGFLOW_FLOW_ID
"""

import json
import sys
import uuid

import requests

LANGFLOW_URL = "http://localhost:7860"


def build_flow_json() -> dict:
    """
    Builds a Langflow 1.x compatible flow JSON for a RAG pipeline:
      TextInput → Chroma retriever → Prompt template → OpenAI LLM → ChatOutput
    """
    node_input_id     = str(uuid.uuid4())
    node_chroma_id    = str(uuid.uuid4())
    node_prompt_id    = str(uuid.uuid4())
    node_llm_id       = str(uuid.uuid4())
    node_output_id    = str(uuid.uuid4())

    nodes = [
        # 1. Chat input — receives the user's question
        {
            "id": node_input_id,
            "type": "ChatInput",
            "position": {"x": 50, "y": 300},
            "data": {
                "type": "ChatInput",
                "node": {
                    "template": {
                        "input_value": {
                            "type": "str",
                            "value": "",
                            "display_name": "Message",
                        }
                    },
                    "description": "User question",
                    "display_name": "User Question",
                }
            }
        },
        # 2. Chroma retriever — queries the vector store built by ingest.py
        {
            "id": node_chroma_id,
            "type": "Chroma",
            "position": {"x": 350, "y": 150},
            "data": {
                "type": "Chroma",
                "node": {
                    "template": {
                        "collection_name": {
                            "type": "str",
                            "value": "fifa_rules",
                            "display_name": "Collection Name",
                        },
                        "persist_directory": {
                            "type": "str",
                            "value": "./chroma_db",
                            "display_name": "Persist Directory",
                        },
                        "number_of_results": {
                            "type": "int",
                            "value": 5,
                            "display_name": "Number of Results",
                        },
                        "search_type": {
                            "type": "str",
                            "value": "Similarity",
                            "display_name": "Search Type",
                        },
                    },
                    "description": "FIFA rules vector store (built by ingest.py)",
                    "display_name": "FIFA Rules Chroma",
                }
            }
        },
        # 3. Prompt template — wraps context + question with the MatchMind system prompt
        {
            "id": node_prompt_id,
            "type": "Prompt",
            "position": {"x": 650, "y": 300},
            "data": {
                "type": "Prompt",
                "node": {
                    "template": {
                        "template": {
                            "type": "str",
                            "value": (
                                "You are MatchMind, an expert FIFA Laws of the Game companion for the World Cup.\n"
                                "Explain VAR decisions, tactical shifts, and football rules with precision and clarity.\n"
                                "Always cite the specific Law or section (e.g. 'Law 11 – Offside').\n\n"
                                "Relevant context from FIFA documents:\n{context}\n\n"
                                "Fan's question: {question}\n\n"
                                "Answer:"
                            ),
                            "display_name": "Template",
                        },
                        "context": {
                            "type": "str",
                            "value": "",
                            "display_name": "Context",
                        },
                        "question": {
                            "type": "str",
                            "value": "",
                            "display_name": "Question",
                        },
                    },
                    "description": "MatchMind system prompt with retrieved context",
                    "display_name": "MatchMind Prompt",
                }
            }
        },
        # 4. OpenAI LLM node (swap model_name to 'ibm/granite-13b-chat-v2' for Granite)
        {
            "id": node_llm_id,
            "type": "OpenAI",
            "position": {"x": 950, "y": 300},
            "data": {
                "type": "OpenAI",
                "node": {
                    "template": {
                        "model_name": {
                            "type": "str",
                            "value": "gpt-4o-mini",
                            "display_name": "Model Name",
                        },
                        "temperature": {
                            "type": "float",
                            "value": 0.3,
                            "display_name": "Temperature",
                        },
                        "max_tokens": {
                            "type": "int",
                            "value": 1024,
                            "display_name": "Max Tokens",
                        },
                        "openai_api_key": {
                            "type": "str",
                            "value": "",
                            "password": True,
                            "display_name": "OpenAI API Key",
                        },
                    },
                    "description": "LLM that generates the final explanation",
                    "display_name": "LLM (OpenAI / Granite)",
                }
            }
        },
        # 5. Chat output — returns the final answer
        {
            "id": node_output_id,
            "type": "ChatOutput",
            "position": {"x": 1250, "y": 300},
            "data": {
                "type": "ChatOutput",
                "node": {
                    "template": {},
                    "description": "Final answer to the fan",
                    "display_name": "Answer",
                }
            }
        },
    ]

    edges = [
        # question → chroma (search query)
        {"id": str(uuid.uuid4()), "source": node_input_id,  "target": node_chroma_id,  "sourceHandle": "text",   "targetHandle": "search_query"},
        # chroma results → prompt context
        {"id": str(uuid.uuid4()), "source": node_chroma_id, "target": node_prompt_id,  "sourceHandle": "results", "targetHandle": "context"},
        # question → prompt question
        {"id": str(uuid.uuid4()), "source": node_input_id,  "target": node_prompt_id,  "sourceHandle": "text",   "targetHandle": "question"},
        # prompt → LLM
        {"id": str(uuid.uuid4()), "source": node_prompt_id, "target": node_llm_id,     "sourceHandle": "prompt",  "targetHandle": "prompt"},
        # LLM → output
        {"id": str(uuid.uuid4()), "source": node_llm_id,    "target": node_output_id,  "sourceHandle": "text",    "targetHandle": "input_value"},
    ]

    return {
        "name": "MatchMind RAG",
        "description": "World Cup AI — explains VAR decisions and rules from FIFA documents",
        "data": {
            "nodes": nodes,
            "edges": edges,
            "viewport": {"x": 0, "y": 0, "zoom": 0.75},
        },
        "is_component": False,
    }


def upload_flow(flow_json: dict) -> str:
    """POST the flow to Langflow and return its ID."""
    resp = requests.post(
        f"{LANGFLOW_URL}/api/v1/flows",
        json=flow_json,
        headers={"Content-Type": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    flow_id = resp.json()["id"]
    return flow_id


def main():
    print("Building MatchMind RAG flow…")
    flow_json = build_flow_json()

    # Save a local copy for reference / manual import
    with open("matchmind_flow.json", "w") as f:
        json.dump(flow_json, f, indent=2)
    print("Saved matchmind_flow.json (can also be imported via Langflow UI)")

    print(f"Uploading to {LANGFLOW_URL}…")
    try:
        flow_id = upload_flow(flow_json)
        print(f"\nFlow created successfully!")
        print(f"  Flow ID: {flow_id}")
        print(f"\nAdd to backend/.env:")
        print(f"  LANGFLOW_URL={LANGFLOW_URL}")
        print(f"  LANGFLOW_FLOW_ID={flow_id}")
    except requests.ConnectionError:
        print(f"\nCould not connect to Langflow at {LANGFLOW_URL}")
        print("Make sure Langflow is running:  langflow run")
        print("You can also import matchmind_flow.json manually via the Langflow UI.")
        sys.exit(1)
    except Exception as e:
        print(f"Upload failed: {e}")
        print("The matchmind_flow.json file was saved — import it via the Langflow UI.")
        sys.exit(1)


if __name__ == "__main__":
    main()
