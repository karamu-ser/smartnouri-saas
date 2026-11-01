from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# For MVP / Local Testing we use SQLite. 
# To switch to PostgreSQL, simply change this URL to:
# SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost/smartnouri"
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./smartnouri.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
