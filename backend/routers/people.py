from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
import models, schemas, database

router = APIRouter(prefix="/api/people", tags=["people"])

@router.post("", response_model=schemas.Person)
def create_person(person: schemas.PersonCreate, db: Session = Depends(database.get_db)):
    # 1. Find or Create Company
    company_name = person.company_name.strip()
    db_company = db.query(models.Company).filter(models.Company.name == company_name).first()
    if not db_company:
        db_company = models.Company(name=company_name, sponsor_status="unknown")
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
    
    # 2. Create Person
    db_person = models.Person(
        company_id=db_company.id,
        name=person.name,
        linkedin_url=person.linkedin_url,
        relationship=person.relationship,
        why_reached_out=person.why_reached_out,
        sponsor_confidence=person.sponsor_confidence,
        status=person.status,
        title=person.title
    )
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person

@router.get("", response_model=List[schemas.Person])
def read_people(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    people = db.query(models.Person).options(
        joinedload(models.Person.company),
        joinedload(models.Person.touchpoints),
        joinedload(models.Person.follow_ups)
    ).offset(skip).limit(limit).all()
    return people

@router.get("/{person_id}", response_model=schemas.Person)
def read_person(person_id: int, db: Session = Depends(database.get_db)):
    person = db.query(models.Person).options(
        joinedload(models.Person.company),
        joinedload(models.Person.touchpoints),
        joinedload(models.Person.follow_ups)
    ).filter(models.Person.id == person_id).first()
    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")
    return person

@router.post("/{person_id}/touchpoints", response_model=schemas.Touchpoint)
def add_touchpoint(person_id: int, touchpoint: schemas.TouchpointCreate, db: Session = Depends(database.get_db)):
    # Verify person exists
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
        
    db_touchpoint = models.Touchpoint(**touchpoint.model_dump(exclude={'next_step_date'}), person_id=person_id)
    db.add(db_touchpoint)
    
    # Auto-generate FollowUp task if date is provided and not closed
    if touchpoint.next_step_date and touchpoint.outcome != "closed":
        # Check if there is already an open follow-up, if so, maybe close it or update it?
        # For simplicity, let's just create a new one.
        action_text = touchpoint.next_step_action or "Follow Up"
        db_followup = models.FollowUp(
            person_id=person_id,
            due_date=touchpoint.next_step_date,
            action=action_text,
            status="open"
        )
        db.add(db_followup)

    db.commit()
    db.refresh(db_touchpoint)
    
    return db_touchpoint
