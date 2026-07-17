# EnterpriseIQ

**An AI-native knowledge platform that turns a company's document library into a citation-grounded, RBAC-aware question-answering system.**

Upload PDFs, Word docs, spreadsheets, or scanned images. EnterpriseIQ extracts, chunks, embeds, and indexes them, then answers natural-language questions through a **multi-agent LangGraph pipeline** that retrieves with hybrid search, drafts an answer, and — critically — **verifies every citation before it ever reaches the user**. If a claim can't be traced back to a real chunk, the system doesn't just soften its tone — it re-retrieves and tries again.

<p>
  <img alt="Python" src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.139-009688?logo=fastapi&logoColor=white">
  <img alt="LangGraph" src="https://img.shields.io/badge/LangGraph-multi--agent-1C3C3C">
  <img alt="ChromaDB" src="https://img.shields.io/badge/ChromaDB-vector%20store-6B4FBB">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Motor%20async-47A248?logo=mongodb&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-cache-DC382D?logo=redis&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/status-active%20development-orange">
</p>

---

## Why this project is interesting

Most "chat with your documents" demos stop at *embed → retrieve → prompt an LLM*. EnterpriseIQ goes further, and the extra layers are where the actual engineering lives:

- **The retrieval isn't naive.** Enterprise documents are full of exact numbers, clause references, and IDs (`"clause 4.2"`, `"$182,400"`) that pure embedding similarity is bad at. EnterpriseIQ fuses **vector search (ChromaDB) with BM25 keyword search** using Reciprocal Rank Fusion, so precise terms and semantic meaning both pull their weight.
- **Answers are graph-orchestrated, not one giant prompt.** A LangGraph state machine routes each query through a **Planner → Retrieval → (Response | Summary) → Verification** loop, with a real edge back to Retrieval if verification fails — not a retry-the-same-prompt hack.
- **Grounding is enforced, not hoped for.** The LLM is required to cite `[chunk:<id>]` for every claim, and the Verification node programmatically checks that each cited ID actually exists in the retrieved set. Unsupported citations trigger an automatic re-query with a refined search before the user ever sees the answer.
- **Access control lives inside the retrieval layer, not just the API.** Every chunk is tagged with `owner_id` / `workspace_id` / `doc_id` and both legs of hybrid search (BM25 *and* vector) are scoped to those tags before ranking even happens — so there's no path where a permission check is "forgotten" on one code path but not another.
- **Ingestion is structure-aware.** PDFs (with OCR fallback for scanned pages), DOCX (headings and tables preserved), and Excel/CSV (kept as real structured records rather than flattened into prose) are each extracted, classified, and chunked differently — because a spreadsheet row and a legal paragraph shouldn't be tokenized the same way.

## Architecture

```
                        ┌─────────────────────────────────────────┐
                        │            React (Vite) SPA              │
                        │  Auth · Documents · Chat · Admin People   │
                        └───────────────────┬───────────────────────┘
                                             │ REST / JWT
                        ┌───────────────────▼───────────────────────┐
                        │              FastAPI backend                │
                        │   auth · users · documents · chat routers   │
                        └───┬─────────────────────────────┬───────────┘
                            │                              │
              ┌─────────────▼───────────┐    ┌─────────────▼─────────────┐
              │   Ingestion Pipeline      │    │      Agent Graph            │
              │  extract → chunk →        │    │       (LangGraph)            │
              │  classify → embed         │    │                                │
              └─────────────┬────────────┘    │   Planner                      │
                             │                  │      │                          │
                ┌────────────▼───────────┐      │      ▼                          │
                │   Vector store layer     │◄────┤  Retrieval  ◄───────────┐      │
                │  Chroma (vectors)         │     │      │                  │      │
                │  BM25 (keyword, RBAC-      │    │      ▼                  │      │
                │   scoped) → fused w/ RRF   │    │  Response / Summary     │      │
                └───────────────────────────┘    │      │                  │      │
                                                   │      ▼                  │      │
                                                   │  Verification ──fail────┘      │
                                                   │      │ pass                    │
                                                   │      ▼                          │
                                                   └────► END (grounded answer)      │
                                                                                       │
                        MongoDB (users, docs, chunks, chat history)  ◄─────────────────┘
                        Redis (cache / session, mock-fallback for zero-setup dev)
```

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| **Orchestration** | [LangGraph](https://github.com/langchain-ai/langgraph) | Explicit state machine for the agent loop, including conditional retry edges — not a linear chain |
| **LLM** | Groq (Llama 3.3 70B) | Fast inference for a responsive chat experience |
| **Vector search** | ChromaDB + `sentence-transformers` (MiniLM) | Persistent, embeddable vector store with no external service required for local dev |
| **Keyword search** | `rank-bm25`, fused via Reciprocal Rank Fusion | Catches exact terms embeddings miss |
| **Document parsing** | PyMuPDF, python-docx, pandas/openpyxl, pytesseract | Format-aware extraction instead of a single "dump to text" path |
| **API** | FastAPI + Pydantic v2, async throughout | Typed, self-documenting (`/docs`), async Mongo I/O via Motor |
| **Auth** | JWT (access + refresh), bcrypt, RBAC | Role-based access enforced at both the API and the retrieval layer |
| **Data** | MongoDB (Motor, async) | Falls back to an in-memory mock automatically when `MONGO_URI` is unset — zero-setup local dev |
| **Cache** | Redis | Same mock-fallback pattern as Mongo |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router | Fast dev loop, utility-first styling, client-side routing for the authenticated app |

## Repository layout

```
enterpriseiq-backend/
  app/
    ingestion/     # extraction -> structure-aware chunking -> classification
    vectorstore/    # Chroma client, BM25 index, hybrid retriever (RRF)
    agents/          # LangGraph state, nodes, and graph assembly
    routers/          # auth, users, documents, chat
    services/          # business logic invoked by routers
    core/               # settings, Redis client
    auth/                # JWT, password hashing, dependencies
enterpriseiq-frontend/
  src/
    pages/          # Home, Auth, Dashboard, Documents, Chat, Profile, Users
    components/      # Navbar, Footer, VerificationTrail, ProtectedRoute
    context/           # Auth + Toast providers
    lib/api.js          # Axios client with silent refresh-token handling
```

## Feature highlights

- **Documents** — drag-and-drop upload, background ingestion with live `uploaded → processing → searchable` status, search, rename, delete, download
- **Chat** — ask questions across the whole library or a single document; every answer ships with a verified/unverified badge and clickable citations back to source chunks and page numbers
- **Auth & RBAC** — register/login/refresh/logout, forgot/reset password, admin-managed roles, protected routes on the frontend and RBAC-scoped queries on the backend
- **Dashboard** — document and question activity at a glance

## API surface

```
POST   /api/auth/register            POST  /api/chat/query
POST   /api/auth/login               GET   /api/chat/history
POST   /api/auth/refresh
POST   /api/auth/forgot-password     POST  /api/documents/upload
POST   /api/auth/reset-password      GET   /api/documents
GET    /api/auth/me                  GET   /api/documents/{id}
                                      PATCH /api/documents/{id}
GET    /api/users                    DELETE /api/documents/{id}
PATCH  /api/users/{id}/role          GET   /api/documents/{id}/download
```

Full interactive schema at `/docs` once the backend is running (FastAPI's auto-generated Swagger UI).

## Getting started

**Backend**
```bash
cd enterpriseiq-backend
pip install -r requirements.txt
cp .env.example .env        # GROQ_API_KEY is required for the chat endpoint
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd enterpriseiq-frontend
npm install
cp .env.example .env        # set VITE_API_URL, e.g. http://localhost:8000
npm run dev
```

Both `MONGO_URI` and `REDIS_URL` default to an in-memory mock when left unset, so the whole stack runs locally with **zero external services** beyond a Groq API key — see each package's own README for the full setup notes, sample `curl` walkthrough, and production-hardening checklist.

## Honest roadmap

This is under active development, and the codebase is upfront about what's next rather than pretending it's finished:

- Business-specific agents (Finance, HR, Contract, Sales, Analytics) — deferred until the core 5-node graph is proven out
- Structured-data querying over ingested Excel/CSV records (stored as JSON today, ready for a future Analytics agent)
- LangGraph checkpointing in Redis for true multi-turn conversation memory
- Cross-encoder re-ranking on top of RRF fusion
- Automated test suite (pytest + httpx), prioritizing the RBAC filter in the retriever

---

*See [`enterpriseiq-backend/README.md`](enterpriseiq-backend/README.md) and [`enterpriseiq-frontend/README.md`](enterpriseiq-frontend/README.md) for detailed setup, environment variables, and sample requests.*
