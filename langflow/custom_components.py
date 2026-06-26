import os
import sys
import json
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

# Ensure Langflow imports work correctly
from langflow.custom import Component
from langflow.io import Output
from langchain.tools import Tool as LCTool, StructuredTool


# ──────────────────────────────────────────────────────────────────────────────
# 1. FIFA Rules Search Tool
# ──────────────────────────────────────────────────────────────────────────────

class FifaRulesTool(Component):
    display_name = "FIFA Rules Search Tool"
    description = "Useful for searching official FIFA Laws of the game, offside rules, and VAR protocols."
    icon = "search"

    outputs = [
        Output(display_name="Tool", name="tool", method="build_tool")
    ]

    def build_tool(self) -> LCTool:
        def search_rules(query: str) -> str:
            try:
                import chromadb
                from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
                
                # Dynamic path resolution:
                # 1. Check container mount path: "/chroma_db"
                # 2. Check local relative path: "./server/chroma_db"
                # 3. Check environment variable or fallback: "chroma_db"
                path = "/chroma_db"
                if not os.path.exists(path):
                    path = "./server/chroma_db"
                if not os.path.exists(path):
                    path = os.getenv("CHROMA_DB_PATH", "chroma_db")
                
                collection_name = os.getenv("CHROMA_COLLECTION", "fifa_rules")
                
                # Initialize persistent client
                client = chromadb.PersistentClient(path=path)
                embed_fn = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
                col = client.get_collection(collection_name, embedding_function=embed_fn)
                
                results = col.query(query_texts=[query], n_results=5)
                chunks = []
                for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
                    chunks.append(
                        f"Section: {meta.get('section', '')} | Page: {meta.get('page', '?')}\n{doc}"
                    )
                
                context = "\n\n".join(chunks)
                return context if context else "No matching rules found in the FIFA documents."
            except Exception as e:
                return f"Error querying database: {e}"

        return LCTool(
            name="search_fifa_rules",
            description=self.description,
            func=search_rules
        )


# ──────────────────────────────────────────────────────────────────────────────
# 2. Web Search Tool (DuckDuckGo)
# ──────────────────────────────────────────────────────────────────────────────

class WebSearchTool(Component):
    display_name = "Web Search Tool"
    description = "Useful for searching the web (DuckDuckGo) for current football news, recent match results, player transfers, injuries, World Cup standings, or anything time-sensitive."
    icon = "globe"

    outputs = [
        Output(display_name="Tool", name="tool", method="build_tool")
    ]

    def build_tool(self) -> LCTool:
        def search_web(query: str) -> str:
            try:
                from duckduckgo_search import DDGS
                results = []
                with DDGS() as ddgs:
                    for r in ddgs.text(query, max_results=5):
                        results.append(r)
                if results:
                    return "\n\n".join(
                        f"[{i+1}] {r.get('title','')}\n{r.get('body','')}"
                        for i, r in enumerate(results)
                    )
                return "No web results found."
            except Exception as e:
                return f"Web search error: {e}"

        return LCTool(
            name="web_search",
            description=self.description,
            func=search_web
        )


# ──────────────────────────────────────────────────────────────────────────────
# 3. Pitch Animation Tool
# ──────────────────────────────────────────────────────────────────────────────

class PlayMove(BaseModel):
    team: str = Field(description="Must be 'home' or 'away'")
    id: int = Field(description="Player ID (1-11)")
    x: float = Field(description="X-coordinate (0-68)")
    y: float = Field(description="Y-coordinate (0-105)")

class PlayFrame(BaseModel):
    label: str = Field(description="Label/description for this frame")
    ball: Dict[str, float] = Field(description="Ball coordinates, e.g. {'x': 34, 'y': 52}")
    moves: List[PlayMove] = Field(description="List of players who move in this frame")

class PlayerInfo(BaseModel):
    id: int = Field(description="Player ID (1-11)")
    name: str = Field(description="Player name")
    num: int = Field(description="Jersey number")

class PlayersSchema(BaseModel):
    home: List[PlayerInfo] = Field(description="Home team players (11 players)")
    away: List[PlayerInfo] = Field(description="Away team players (11 players)")

class PitchAnimationInput(BaseModel):
    title: str = Field(description="Short title shown above the pitch")
    home_formation: str = Field(description="Formation for HOME team (e.g. 4-3-3)")
    away_formation: str = Field(description="Formation for AWAY team (e.g. 4-4-2)")
    players: PlayersSchema = Field(description="Names and jersey numbers for both teams")
    frames: List[PlayFrame] = Field(description="Reconstructed frames of player moves")
    offside_y: Optional[float] = Field(default=None, description="Y-coordinate of offside line if applicable")
    incident_point: Optional[Dict[str, float]] = Field(default=None, description="Coordinates of the foul or key play")

class PitchAnimationTool(Component):
    display_name = "Pitch Animation Tool"
    description = "Creates 2D pitch animations for tactical formations, offside plays, or VAR check reviews."
    icon = "play"

    outputs = [
        Output(display_name="Tool", name="tool", method="build_tool")
    ]

    def build_tool(self) -> LCTool:
        def create_pitch_animation(**kwargs) -> str:
            # Returns a serialized representation of the animation data.
            # The backend parses the LLM output containing this response.
            return f"Pitch animation created successfully. Data: {json.dumps(kwargs)}"

        return StructuredTool(
            name="create_pitch_animation",
            description=self.description,
            func=create_pitch_animation,
            args_schema=PitchAnimationInput
        )
