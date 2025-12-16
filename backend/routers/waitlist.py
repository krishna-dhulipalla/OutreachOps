from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import date
import models, schemas, database

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])

class WaitlistItemCreate(BaseModel):
    company: str
    name: str | None = None
    priority: str = "B"
    reason: str | None = None
    planned_action_date: date | None = None

class WaitlistItem(WaitlistItemCreate):
    id: int
    status: str
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[WaitlistItem])
def get_waitlist(db: Session = Depends(database.get_db)):
    return db.query(models.Waitlist).filter(models.Waitlist.status == "active").all()

@router.post("", response_model=WaitlistItem)
def add_waitlist_item(item: WaitlistItemCreate, db: Session = Depends(database.get_db)):
    db_item = models.Waitlist(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/{item_id}/convert")
def convert_to_contact(item_id: int, db: Session = Depends(database.get_db)):
    # This endpoint might just mark it as converted, 
    # the actual creation of Person happens via POST /people 
    # but maybe the frontend pre-fills the form.
    item = db.query(models.Waitlist).filter(models.Waitlist.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    item.status = "converted"
    db.commit()
    return {"message": "Marked as converted"}
