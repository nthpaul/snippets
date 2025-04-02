from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, get_db
from models import Base, Message
from typing import List

app = FastAPI()

@app.get("/hello/{name}")
def say_hello(name: str, db: Session = Depends(get_db)):
    try:
        message = Message(content=f"Hello, {name}")
        db.add(message)
        db.commit()
        db.refresh(message)
        return {"message": message.content}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/messages", response_model=List[dict])
def get_messages(db: Session = Depends(get_db)):
    messages = db.query(Message).all()
    return [{"id": msg.id, "content": msg.content} for msg in messages]
