import os
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt

from dotenv import load_dotenv
load_dotenv()

# Configuration — ⛔ Aucun fallback en production
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY == "your-super-secret-development-key-change-in-production":
    raise RuntimeError("❌ SECRET_KEY non configurée ! Créez backend/.env avec une clé forte.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 heures

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
