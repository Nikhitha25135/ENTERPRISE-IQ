from datetime import datetime, timedelta, timezone
from typing import Literal

from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()


def _create_token(subject: str, role: str, expires_delta: timedelta, token_type: Literal["access", "refresh"]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "type": token_type,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(subject: str, role: str) -> str:
    return _create_token(
        subject, role, timedelta(minutes=settings.access_token_expire_minutes), "access"
    )


def create_refresh_token(subject: str, role: str) -> str:
    return _create_token(
        subject, role, timedelta(days=settings.refresh_token_expire_days), "refresh"
    )


class InvalidTokenError(Exception):
    pass


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
