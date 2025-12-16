from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import models, schemas, database

router = APIRouter(prefix="/api/companies", tags=["companies"])

class CompanySummary(schemas.CompanyBase):
    id: int
    contact_count: int
    last_touch_date: Optional[str] = None
    next_follow_up_date: Optional[str] = None

@router.get("", response_model=List[CompanySummary])
def read_companies(db: Session = Depends(database.get_db)):
    # This logic is a bit complex for ORM directly if we want efficient aggregation.
    # For MVP, fetching all companies and computing in python or using simple joins.
    # Let's try a simpler approach: Get all companies with contacts, then aggregate.
    companies = db.query(models.Company).all()
    results = []
    
    for comp in companies:
        contact_count = len(comp.contacts)
        if contact_count == 0:
            continue # Optional: only show companies with contacts or show all? 
                     # Requirement says "Group contacts by company", implying active ones.
        
        last_touch = None
        next_due = None
        
        # Inefficient loop but works for MVP small data
        all_touchpoints = []
        all_followups = []
        for p in comp.contacts:
            all_touchpoints.extend(p.touchpoints)
            all_followups.extend([f for f in p.follow_ups if f.status == 'open'])
            
        if all_touchpoints:
            # Sort desc
            all_touchpoints.sort(key=lambda x: x.date, reverse=True)
            last_touch = all_touchpoints[0].date.isoformat()
            
        if all_followups:
            all_followups.sort(key=lambda x: x.due_date)
            next_due = all_followups[0].due_date.isoformat()

        results.append(CompanySummary(
            id=comp.id,
            name=comp.name,
            sponsor_status=comp.sponsor_status,
            notes=comp.notes,
            contact_count=contact_count,
            last_touch_date=last_touch,
            next_follow_up_date=next_due
        ))
        
    return results
