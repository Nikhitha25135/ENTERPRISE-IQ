"""
Structure-aware chunking.

Text is split on paragraph/section boundaries with a token-ish overlap
(word-count is used as a cheap proxy for tokens rather than pulling in a
tokenizer just for chunk sizing). Tables are chunked by row-groups so a
single chunk never straddles an arbitrary character boundary in the middle
of a row, which is what happens with naive fixed-size text splitting.
"""
from app.core.config import get_settings

settings = get_settings()


def _split_words(text: str) -> list[str]:
    return text.split()


def chunk_text_pages(pages: list[dict], chunk_size: int | None = None, overlap: int | None = None) -> list[dict]:
    """pages: [{"page": int, "text": str}, ...] -> [{"page": int, "text": str}, ...] chunks."""
    chunk_size = chunk_size or settings.chunk_size_tokens
    overlap = overlap or settings.chunk_overlap_tokens
    chunks = []

    for page in pages:
        text = page["text"]
        if not text.strip():
            continue

        # Prefer splitting on blank lines / headings first (structure-aware),
        # then pack paragraphs into chunk_size-sized windows with overlap.
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [text.strip()]

        buffer: list[str] = []
        buffer_len = 0
        for para in paragraphs:
            words = _split_words(para)
            if buffer_len + len(words) > chunk_size and buffer:
                chunks.append({"page": page["page"], "text": "\n\n".join(buffer)})
                # carry the overlap tail forward
                tail_words = _split_words(" ".join(buffer))[-overlap:] if overlap else []
                buffer = [" ".join(tail_words)] if tail_words else []
                buffer_len = len(tail_words)
            buffer.append(para)
            buffer_len += len(words)

        if buffer:
            chunks.append({"page": page["page"], "text": "\n\n".join(buffer)})

    return chunks


def chunk_tables(tables: list[dict], rows_per_chunk: int = 25) -> list[dict]:
    """tables: output of extract_tabular -> row-group chunks with a markdown
    rendering (for embedding) plus the raw JSON records (for structured
    querying by a future Analytics Agent)."""
    chunks = []
    for table in tables:
        sheet = table["sheet"]
        columns = table["columns"]
        records = table["records"]

        for start in range(0, len(records), rows_per_chunk):
            group = records[start : start + rows_per_chunk]
            markdown = _records_to_markdown(columns, group)
            chunks.append(
                {
                    "page": None,
                    "sheet": sheet,
                    "row_start": start,
                    "row_end": start + len(group),
                    "text": f"Sheet: {sheet}\n{markdown}",
                    "records": group,
                }
            )
    return chunks


def _records_to_markdown(columns: list[str], records: list[dict]) -> str:
    lines = ["| " + " | ".join(columns) + " |", "| " + " | ".join(["---"] * len(columns)) + " |"]
    for record in records:
        lines.append("| " + " | ".join(str(record.get(c, "")) for c in columns) + " |")
    return "\n".join(lines)
