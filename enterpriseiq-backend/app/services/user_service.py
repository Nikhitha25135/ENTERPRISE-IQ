from bson import ObjectId
from fastapi import HTTPException, status

from app.models.enums import UserRole
from app.schemas.user import UserOut, UserProfileUpdate


async def update_profile(db, user_id: str, payload: UserProfileUpdate) -> dict:
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update_data})
    return await db["users"].find_one({"_id": ObjectId(user_id)})


async def list_users(db) -> list[dict]:
    cursor = db["users"].find({})
    return await cursor.to_list(length=1000)


async def set_role(db, user_id: str, role: UserRole) -> dict:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

    result = await db["users"].find_one_and_update(
        {"_id": ObjectId(user_id)}, {"$set": {"role": role.value}}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return result
