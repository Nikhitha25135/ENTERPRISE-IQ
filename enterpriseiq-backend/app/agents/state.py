"""
Shared state passed between every node in the LangGraph agent graph.

Kept as a single TypedDict (rather than each agent inventing its own
in/out schema) so the graph's edges are simple functions of one object —
this is what makes the verification -> retry loop possible: a node just
reads/writes fields on the same state, and LangGraph re-enters the graph
at whichever node the conditional edge points to.
"""
from typing import Optional, TypedDict


class ChunkRef(TypedDict):
    chunk_id: str
    text: str
    doc_id: str
    file_name: str
    page: Optional[int]
    category: str
    fused_score: float


class GraphState(TypedDict, total=False):
    # input
    query: str
    owner_id: str
    workspace_id: Optional[str]
    doc_id: Optional[str]

    # planner output
    intent: str  # "qa" | "summary"

    # retrieval output
    chunks: list[ChunkRef]
    retry_count: int
    retry_note: str

    # response output
    answer: str
    cited_chunk_ids: list[str]

    # verification output
    verified: bool
    unsupported_citations: list[str]
    verification_note: str
    should_retry: bool
