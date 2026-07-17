from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class ProcessingStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    SEARCHABLE = "searchable"
    FAILED = "failed"


class DocumentCategory(str, Enum):
    FINANCE = "finance"
    HR = "hr"
    LEGAL = "legal"
    SALES = "sales"
    OPERATIONS = "operations"
    GENERAL = "general"


class QueryIntent(str, Enum):
    QA = "qa"
    SUMMARY = "summary"
