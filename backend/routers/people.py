from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, timedelta
from .. import models, schemas, database

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
        title=person.title,
        outreach_channels=person.outreach_channels,
        links=person.links
    )
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    
    # 3. Create Touchpoints / Follow-ups Logic
    if person.create_initial_followup:
        # Create an initial follow-up task
        days = person.initial_followup_days if person.initial_followup_days else 2
        follow_up = models.FollowUp(
            person_id=db_person.id,
            due_date=date.today() + timedelta(days=days),
            action="Follow Up"
        )
        db.add(follow_up)
        db.commit()

    return db_person

@router.delete("/{person_id}")
def delete_person(person_id: int, db: Session = Depends(database.get_db)):
    person = db.query(models.Person).filter(models.Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    db.delete(person)
    db.commit()
    return {"ok": True}

@router.put("/{person_id}", response_model=schemas.Person)
def update_person(person_id: int, person_update: schemas.PersonUpdate, db: Session = Depends(database.get_db)):
    db_person = db.query(models.Person).options(
        joinedload(models.Person.company),
        joinedload(models.Person.touchpoints),
        joinedload(models.Person.follow_ups),
    ).filter(models.Person.id == person_id).first()
    if not db_person:
        raise HTTPException(status_code=404, detail="Person not found")

    if person_update.name is not None:
        db_person.name = person_update.name
    if person_update.title is not None:
        db_person.title = person_update.title
    if person_update.relationship is not None:
        db_person.relationship = person_update.relationship
    if person_update.why_reached_out is not None:
        db_person.why_reached_out = person_update.why_reached_out
    if person_update.outreach_channels is not None:
        db_person.outreach_channels = person_update.outreach_channels
    if person_update.links is not None:
        db_person.links = person_update.links
    if person_update.status is not None:
        db_person.status = person_update.status
    if person_update.linkedin_url is not None:
        db_person.linkedin_url = person_update.linkedin_url
    if person_update.sponsor_confidence is not None:
        db_person.sponsor_confidence = person_update.sponsor_confidence
    
    # Handle company change if needed (simplified: just update name if same company or switch?)
    # For now assuming company name update might mean re-linking. 
    # Let's keep it simple: if company name differs, find/create new company.
    if (
        person_update.company_name is not None
        and person_update.company_name.strip()
        and person_update.company_name.strip() != db_person.company.name
    ):
        company_name = person_update.company_name.strip()
        db_company = db.query(models.Company).filter(models.Company.name == company_name).first()
        if not db_company:
            db_company = models.Company(name=company_name, sponsor_status="unknown")
            db.add(db_company)
            db.commit()
            db.refresh(db_company)
        db_person.company_id = db_company.id

    db.commit()

    updated = db.query(models.Person).options(
        joinedload(models.Person.company),
        joinedload(models.Person.touchpoints),
        joinedload(models.Person.follow_ups),
    ).filter(models.Person.id == person_id).first()
    return updated

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
