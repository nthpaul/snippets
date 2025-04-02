# database.py is a file that contains the database connection and session creation.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from models import Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print(f"Attempting to connect to: {DATABASE_URL}")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db  # yield is used to return the db object to the caller
    except Exception as e:
        print("Error: ", e)
        db.close()
    finally:
        db.close()
