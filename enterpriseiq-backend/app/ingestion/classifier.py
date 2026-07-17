"""
Document classification.

A cheap, deterministic keyword-scoring classifier — good enough for the MVP
and free to run on every document (no LLM call). Swap this out for an
embedding-similarity or fine-tuned classifier later without touching
anything downstream, since it only ever returns a DocumentCategory value.
"""
from app.models.enums import DocumentCategory

_KEYWORDS = {
    DocumentCategory.FINANCE: [
        "revenue", "expense", "budget", "invoice", "balance sheet", "profit",
        "loss", "cash flow", "fiscal", "audit", "tax", "accounts payable",
    ],
    DocumentCategory.HR: [
        "employee", "payroll", "leave", "vacation", "onboarding", "benefits",
        "performance review", "recruitment", "salary", "policy handbook",
    ],
    DocumentCategory.LEGAL: [
        "agreement", "clause", "obligation", "liability", "termination",
        "governing law", "indemnif", "confidential", "contract", "party",
    ],
    DocumentCategory.SALES: [
        "quota", "pipeline", "lead", "customer", "deal", "kpi", "conversion",
        "sales target", "crm", "opportunity",
    ],
    DocumentCategory.OPERATIONS: [
        "process", "sop", "workflow", "supply chain", "inventory",
        "logistics", "vendor", "procurement", "maintenance",
    ],
}


def classify_text(text: str) -> DocumentCategory:
    lowered = text.lower()
    scores = {category: 0 for category in _KEYWORDS}

    for category, keywords in _KEYWORDS.items():
        for kw in keywords:
            scores[category] += lowered.count(kw)

    best_category = max(scores, key=scores.get)
    if scores[best_category] == 0:
        return DocumentCategory.GENERAL
    return best_category
