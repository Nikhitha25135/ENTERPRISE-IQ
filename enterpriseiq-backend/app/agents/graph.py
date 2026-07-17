"""
LangGraph orchestration.

    START -> Planner -> Retrieval -+-(qa)------> Response --+
                                    +-(summary)-> Summary  --+--> Verification --+
                                                                                  +-(fails, retries left)-> Retrieval
                                                                                  +-(passes / out of retries)-> END

Both intents route through Retrieval first (Summary needs chunks too, just
more of them — handled in the retrieval node), then branch to either the
Response Agent or Summary Agent, then always through Verification. This is
what gives the "grounding check" real teeth: Verification can send the
whole thing back through Retrieval with a refined query rather than just
rubber-stamping the first draft.
"""
from typing import Optional

from langgraph.graph import END, StateGraph

from app.agents.nodes import (
    make_planner_node,
    make_response_node,
    make_retrieval_node,
    make_summary_node,
    make_verification_node,
)
from app.agents.state import GraphState


def _route_generation_branch(state: GraphState) -> str:
    return "summary" if state.get("intent") == "summary" else "response"


def _route_after_verification(state: GraphState) -> str:
    return "retrieval" if state.get("should_retry") else END


def build_graph(db):
    graph = StateGraph(GraphState)

    graph.add_node("planner", make_planner_node(db))
    graph.add_node("retrieval", make_retrieval_node(db))
    graph.add_node("summary", make_summary_node(db))
    graph.add_node("response", make_response_node(db))
    graph.add_node("verification", make_verification_node(db))

    graph.set_entry_point("planner")
    graph.add_edge("planner", "retrieval")
    graph.add_conditional_edges(
        "retrieval", _route_generation_branch, {"summary": "summary", "response": "response"}
    )
    graph.add_edge("summary", "verification")
    graph.add_edge("response", "verification")
    graph.add_conditional_edges(
        "verification", _route_after_verification, {"retrieval": "retrieval", END: END}
    )

    return graph.compile()


async def run_query(
    db, query: str, owner_id: str, workspace_id: Optional[str] = None, doc_id: Optional[str] = None
) -> GraphState:
    app_graph = build_graph(db)
    initial_state: GraphState = {
        "query": query,
        "owner_id": owner_id,
        "workspace_id": workspace_id,
        "doc_id": doc_id,
        "retry_count": 0,
        "retry_note": "",
    }
    final_state = await app_graph.ainvoke(initial_state)
    return final_state
