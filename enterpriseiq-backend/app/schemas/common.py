"""Shared schema helpers."""
from typing import Any

from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema


class PyObjectId(str):
    """Allows MongoDB's ObjectId to be used cleanly in Pydantic v2 models,
    always serialized to/from a plain string over the API."""

    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        def validate(value: Any) -> str:
            if isinstance(value, ObjectId):
                return str(value)
            if isinstance(value, str) and ObjectId.is_valid(value):
                return value
            raise ValueError("Invalid ObjectId")

        return core_schema.no_info_plain_validator_function(
            validate, serialization=core_schema.to_string_ser_schema()
        )
