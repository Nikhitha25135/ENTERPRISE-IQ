from fastapi import APIRouter, Depends, status

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.schemas.auth import LoginResponse, RefreshTokenRequest, TokenPair
from app.schemas.user import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserLogin,
    UserOut,
    UserRegister,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, db=Depends(get_db)):
    return await auth_service.register_user(db, payload)


@router.post("/login", response_model=LoginResponse)
async def login(payload: UserLogin, db=Depends(get_db)):
    return await auth_service.authenticate_user(db, payload)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshTokenRequest, db=Depends(get_db)):
    return await auth_service.refresh_access_token(db, payload.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: dict = Depends(get_current_user)):
    # Stateless JWTs: logout is enforced client-side by discarding tokens.
    # For server-side revocation, maintain a denylist of token IDs in Redis
    # keyed by jti with TTL = token expiry.
    return None


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(payload: ForgotPasswordRequest, db=Depends(get_db)):
    await auth_service.initiate_password_reset(db, payload.email)
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def reset_password(payload: ResetPasswordRequest, db=Depends(get_db)):
    await auth_service.reset_password(db, payload.token, payload.new_password)
    return None


@router.get("/me", response_model=UserOut)
async def me(current_user: dict = Depends(get_current_user)):
    return current_user
