"""
Password hashing via bcrypt, used directly (not through passlib) to avoid
passlib's brittle backend auto-detection against modern bcrypt releases.
"""
import bcrypt

_BCRYPT_MAX_BYTES = 72  # bcrypt silently ignores anything past this


def hash_password(plain_password: str) -> str:
    password_bytes = plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
