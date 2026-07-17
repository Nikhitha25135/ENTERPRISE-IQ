import logging
import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import HTTPException, status

from app.auth.jwt_handler import create_access_token, create_refresh_token, decode_token, InvalidTokenError
from app.auth.password import hash_password, verify_password
from app.models.enums import UserRole
from app.schemas.auth import LoginResponse, TokenPair
from app.schemas.user import UserLogin, UserOut, UserRegister

logger = logging.getLogger(__name__)

# In-memory store for password reset tokens (dev only).
# In production this belongs in Redis with a TTL.
_RESET_TOKENS: dict[str, tuple[str, datetime]] = {}


async def register_user(db, payload: UserRegister) -> UserOut:
    existing = await db["users"].find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    doc = {
        "full_name": payload.full_name,
        "email": payload.email.lower(),
        "hashed_password": hash_password(payload.password),
        "organization": payload.organization,
        "role": UserRole.EMPLOYEE.value,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["users"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return UserOut(**doc)


async def authenticate_user(db, payload: UserLogin) -> LoginResponse:
    user = await db["users"].find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["role"])
    refresh_token = create_refresh_token(user_id, user["role"])

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut(**user),
    )


async def refresh_access_token(db, refresh_token: str) -> TokenPair:
    try:
        payload = decode_token(refresh_token)
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expected a refresh token")

    user = await db["users"].find_one({"_id": ObjectId(payload["sub"])})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists or is inactive")

    user_id = str(user["_id"])
    return TokenPair(
        access_token=create_access_token(user_id, user["role"]),
        refresh_token=create_refresh_token(user_id, user["role"]),
    )


async def initiate_password_reset(db, email: str) -> None:
    """Always returns silently (even for unknown emails) to avoid leaking
    which addresses are registered."""
    user = await db["users"].find_one({"email": email.lower()})
    if not user:
        logger.info("Password reset requested for unknown email %s", email)
        return

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    _RESET_TOKENS[token] = (str(user["_id"]), expires_at)

    # TODO: wire up a real email provider (SES / SendGrid / Postmark).
    # For now this is logged so the flow is testable end-to-end locally.
    logger.info("Password reset token for %s: %s (expires %s)", email, token, expires_at)


async def reset_password(db, token: str, new_password: str) -> None:
    entry = _RESET_TOKENS.get(token)
    if not entry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    user_id, expires_at = entry
    if datetime.now(timezone.utc) > expires_at:
        del _RESET_TOKENS[token]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired")

    await db["users"].update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"hashed_password": hash_password(new_password)}}
    )
    del _RESET_TOKENS[token]
