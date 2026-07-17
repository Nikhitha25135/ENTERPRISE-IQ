"""
End-to-end ingestion pipeline.

Runs as a FastAPI background task right after a document is uploaded:

    extract -> chunk (structure-aware) -> classify -> embed -> store
        (Mongo "chunks" collection for BM25/full-text + ChromaDB for vectors)

`document_service.save_document` flips `processing_status` from UPLOADED to
PROCESSING immediately, then this pipeline flips it to SEARCHABLE (or FAILED
with the error recorded) once it's done. The document only becomes
retrievable by the agent layer once it hits SEARCHABLE.
"""
import logging
import uuid
from datetime import datetime, timezone

from app.ingestion.chunking import chunk_tables, chunk_text_pages
from app.ingestion.classifier import classify_text
from app.ingestion.extractors import extract_document
from app.models.enums import ProcessingStatus
from app.vectorstore import chroma_store
from app.vectorstore.embeddings import embed_texts

logger = logging.getLogger(__name__)


async def process_document(db, document: dict) -> None:
    doc_id = str(document["_id"])
    owner_id = document["owner_id"]
    workspace_id = document.get("workspace_id")
    file_name = document["file_name"]
    ext = f".{document['file_type']}"
    stored_path = document["stored_path"]

    await db["documents"].update_one(
        {"_id": document["_id"]}, {"$set": {"processing_status": ProcessingStatus.PROCESSING.value}}
    )

    try:
        extracted = extract_document(stored_path, ext)

        if extracted["kind"] == "table":
            raw_chunks = chunk_tables(extracted["tables"])
        else:
            raw_chunks = chunk_text_pages(extracted["pages"])
            # keep num_pages for the document record
            num_pages = len(extracted["pages"])
            await db["documents"].update_one({"_id": document["_id"]}, {"$set": {"num_pages": num_pages}})

        if not raw_chunks:
            await db["documents"].update_one(
                {"_id": document["_id"]},
                {"$set": {"processing_status": ProcessingStatus.FAILED.value, "processing_error": "No extractable content found"}},
            )
            return

        full_text_sample = " ".join(c["text"] for c in raw_chunks[:5])
        category = classify_text(full_text_sample)

        texts = [c["text"] for c in raw_chunks]
        embeddings = embed_texts(texts)

        chunk_docs = []
        chroma_records = []
        for chunk, embedding in zip(raw_chunks, embeddings):
            chunk_id = uuid.uuid4().hex
            chunk_docs.append(
                {
                    "chunk_id": chunk_id,
                    "doc_id": doc_id,
                    "owner_id": owner_id,
                    "workspace_id": workspace_id,
                    "file_name": file_name,
                    "page": chunk.get("page"),
                    "category": category.value,
                    "text": chunk["text"],
                    "created_at": datetime.now(timezone.utc),
                }
            )
            chroma_records.append(
                {
                    "id": chunk_id,
                    "text": chunk["text"],
                    "embedding": embedding,
                    "owner_id": owner_id,
                    "workspace_id": workspace_id,
                    "doc_id": doc_id,
                    "page": chunk.get("page"),
                    "category": category.value,
                    "file_name": file_name,
                }
            )

        if chunk_docs:
            await db["chunks"].insert_many(chunk_docs)
        chroma_store.upsert_chunks(chroma_records)

        await db["documents"].update_one(
            {"_id": document["_id"]},
            {
                "$set": {
                    "processing_status": ProcessingStatus.SEARCHABLE.value,
                    "category": category.value,
                    "chunk_count": len(chunk_docs),
                }
            },
        )
        logger.info("Document %s ingested: %d chunks, category=%s", doc_id, len(chunk_docs), category.value)

    except Exception as exc:
        logger.exception("Ingestion failed for document %s", doc_id)
        await db["documents"].update_one(
            {"_id": document["_id"]},
            {"$set": {"processing_status": ProcessingStatus.FAILED.value, "processing_error": str(exc)}},
        )


async def delete_document_index(db, doc_id: str) -> None:
    """Called from document_service.delete_document to keep Chroma + the
    chunks collection in sync when a document is removed."""
    await db["chunks"].delete_many({"doc_id": doc_id})
    chroma_store.delete_document_chunks(doc_id)
