# EnterpriseIQ — Backend API (Slice 2: Multi-Agent RAG)

Slice 1 (auth, RBAC, document upload) plus the full ingestion pipeline and
LangGraph multi-agent RAG layer: extraction → structure-aware chunking →
classification → embeddings → hybrid (BM25 + vector) retrieval → a
Planner/Retrieval/Summary/Response/Verification agent graph with a
grounding-check retry loop.

## What's implemented

- **Auth / RBAC / Users** — unchanged from Slice 1
- **Document upload** — now kicks off ingestion automatically as a background
  task; `processing_status` moves `uploaded → processing → searchable`
  (or `failed`, with `processing_error` set)
- **Ingestion pipeline** (`app/ingestion/`)
  - Extraction: PDF (PyMuPDF, with OCR fallback for scanned pages), DOCX
    (python-docx, headings + tables preserved), Excel/CSV (pandas — kept as
    real structured records, not flattened into prose), images (OCR)
  - Structure-aware chunking: paragraph/section-based for text, row-group
    based for tables (`app/ingestion/chunking.py`)
  - Lightweight keyword-based document classification into
    Finance/HR/Legal/Sales/Operations/General (`app/ingestion/classifier.py`)
- **Vector store & retrieval** (`app/vectorstore/`)
  - Embeddings via Hugging Face `sentence-transformers` (`embeddings.py`)
  - ChromaDB persistent store, every chunk tagged with `owner_id` /
    `workspace_id` / `doc_id` so RBAC is enforced **inside** retrieval, not
    just at the API layer (`chroma_store.py`)
  - BM25 keyword search over the RBAC-scoped candidate set (`bm25_index.py`)
  - Hybrid search: vector + BM25 results fused with Reciprocal Rank Fusion
    (`retriever.py`)
- **Multi-agent RAG** (`app/agents/`), orchestrated with **LangGraph**:
  ```
  Planner -> Retrieval -> (Response | Summary) -> Verification -+-> END
                                                                  +-> Retrieval (retry, up to MAX_VERIFICATION_RETRIES)
  ```
  - **Planner**: routes intent to `qa` or `summary`
  - **Retrieval**: hybrid search, RBAC-scoped, pulls more context for summaries
  - **Response / Summary**: Groq LLM, required to cite `[chunk:<id>]` for
    every claim
  - **Verification**: checks every citation actually exists in the retrieved
    set (not a vague "grounding vibe check") — unsupported or missing
    citations trigger a retry with a refined query; after max retries it
    returns a best-effort answer with an explicit caveat appended
- **Chat API**: `POST /api/chat/query`, `GET /api/chat/history` — every
  query/answer/verification result is persisted to Mongo's `chats` collection
- **Redis** — cache/session layer with the same mock-fallback pattern as
  Mongo (`app/core/redis_client.py`); currently used for cache plumbing, not
  yet wired as a LangGraph checkpointer (see "Not yet built" below)

## What's still stubbed / not yet built

- **Business-specific agents** (Finance, HR, Contract, Sales, Analytics,
  Report) — intentionally deferred until the 5-node MVP graph is proven out,
  per the original roadmap
- **Structured-data querying**: Excel/CSV rows are stored as real JSON
  records in Mongo (`chunks.records`) so a future Analytics Agent can run
  pandas/SQL-style queries over them directly, but no such agent exists yet —
  today they're only searchable via their markdown text rendering
- **LangGraph checkpointing in Redis** — the graph currently runs
  single-shot per request; persisting `GraphState` to Redis between turns
  (for true multi-turn conversation memory) is a natural next step
- **Re-ranking**: retrieval uses RRF score fusion, not a cross-encoder
  re-ranker — worth adding once you have real recall/precision numbers to
  improve
- Password reset "emails" are still just logged, not actually sent

## Project structure (new since Slice 1)

```
app/
  ingestion/
    extractors.py     # PDF/DOCX/Excel/CSV/image -> normalized text or table structure
    chunking.py        # structure-aware chunking (paragraphs / row-groups)
    classifier.py       # keyword-based document category classifier
    pipeline.py          # orchestrates extraction -> chunk -> classify -> embed -> store
  vectorstore/
    embeddings.py      # sentence-transformers wrapper (lazy-loaded singleton)
    chroma_store.py     # ChromaDB client, RBAC-filtered upsert/query
    bm25_index.py        # in-memory BM25 over the RBAC-scoped candidate set
    retriever.py           # hybrid_search() = vector + BM25 fused via RRF
  agents/
    state.py           # GraphState TypedDict shared across all nodes
    llm.py               # Groq chat completion wrapper
    nodes.py               # Planner / Retrieval / Summary / Response / Verification
    graph.py                 # LangGraph StateGraph assembly incl. retry edge
  core/redis_client.py  # Redis connection w/ in-memory fallback (mirrors database.py)
  schemas/chat.py         # ChatQueryRequest/Response, CitationOut
  services/chat_service.py  # invokes the graph, persists chat history
  routers/chat.py             # POST /api/chat/query, GET /api/chat/history
```

## Running locally

```bash
pip install -r requirements.txt
cp .env.example .env      # edit as needed — GROQ_API_KEY is required for chat
uvicorn app.main:app --reload
```

Then open **http://localhost:8000/docs**.

### Required for the RAG layer to actually answer questions

1. **`GROQ_API_KEY`** — free key at https://console.groq.com. Without it,
   `/api/chat/query` will raise a clear `RuntimeError` rather than fail
   silently.
2. **System `tesseract` binary** for OCR (scanned PDFs / images) —
   `pytesseract` is just a Python wrapper around it:
   ```bash
   # Debian/Ubuntu
   sudo apt-get install -y tesseract-ocr
   # macOS
   brew install tesseract
   ```
   If it's not on your PATH, set `TESSERACT_CMD` in `.env`. If it's missing
   entirely, OCR silently degrades to empty text rather than crashing
   ingestion — non-scanned files are unaffected either way.
3. The **first embedding call** downloads the `all-MiniLM-L6-v2` model
   (~90MB) from Hugging Face — needs internet access once, then it's cached
   locally.

### About Redis

Same pattern as Mongo: leave `REDIS_URL` empty for a zero-setup in-memory
fallback (fine for local dev/demo), or point it at a real instance for
anything persistent across restarts / multiple workers.

### Try it out

```bash
# Upload a document (replace TOKEN)
curl -X POST localhost:8000/api/documents/upload \
  -H "Authorization: Bearer TOKEN" -F "file=@quarterly_report.pdf"

# Check processing status
curl localhost:8000/api/documents/<id> -H "Authorization: Bearer TOKEN"
# wait for processing_status to flip to "searchable"

# Ask a question — runs the full Planner -> Retrieval -> Response -> Verification graph
curl -X POST localhost:8000/api/chat/query \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{
  "query": "What was Q3 revenue and how does it compare to Q2?"
}'

# Ask for a summary of one specific document
curl -X POST localhost:8000/api/chat/query \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" -d '{
  "query": "Summarize this document",
  "document_id": "<doc id from upload response>"
}'
```

A response looks like:

```json
{
  "answer": "Q3 revenue was $4.2M, up 12% from Q2's $3.75M [chunk:9f2a1b...].",
  "intent": "qa",
  "verified": true,
  "verification_note": "Verified: all citations trace back to retrieved chunks.",
  "citations": [
    {"chunk_id": "9f2a1b...", "doc_id": "...", "file_name": "quarterly_report.pdf", "page": 4, "text_preview": "..."}
  ]
}
```

## Notes on production-readiness

- Set a strong random `JWT_SECRET_KEY`; point `MONGO_URI` and `REDIS_URL` at
  real instances before deploying
- Chroma is running in single-process persistent mode — for multi-worker
  deployments, run it as a standalone server (`chromadb run`) and point the
  client at it over HTTP instead
- BM25 is rebuilt per-query from Mongo — fine at MVP scale; swap for a
  persistent inverted index (OpenSearch/Elasticsearch) once corpus size makes
  that slow
- Add rate limiting on `/api/chat/query` (LLM calls aren't free) and on
  `/api/auth/*`
- Add automated tests (pytest + httpx AsyncClient), especially around the
  RBAC filter in `retriever.py` — that's the one thing that must never regress
