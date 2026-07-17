from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.enums import UserRole
from app.schemas.user import UserOut, UserProfileUpdate
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_my_profile(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return await user_service.update_profile(db, str(current_user["_id"]), payload)


@router.get("", response_model=list[UserOut])
async def list_users(
    current_user: dict = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
    db=Depends(get_db),
):
    """Admin/Manager only — list all users in the organization."""
    return await user_service.list_users(db)


@router.patch("/{user_id}/role", response_model=UserOut)
async def change_user_role(
    user_id: str,
    role: UserRole,
    current_user: dict = Depends(require_roles(UserRole.ADMIN)),
    db=Depends(get_db),
):
    """Admin only — change another user's role."""
    return await user_service.set_role(db, user_id, role)
