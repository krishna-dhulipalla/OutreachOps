from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, desc
from datetime import date
from typing import List, Dict
from .. import models, schemas, database

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/today")
def get_today_dashboard(db: Session = Depends(database.get_db)):
    today = date.today()
    
    # Overdue
    overdue_tasks = db.query(models.FollowUp).options(joinedload(models.FollowUp.person).joinedload(models.Person.company))\
        .filter(models.FollowUp.status == "open", models.FollowUp.due_date < today)\
        .order_by(asc(models.FollowUp.due_date))\
        .all()
        
    # Due Today
    today_tasks = db.query(models.FollowUp).options(joinedload(models.FollowUp.person).joinedload(models.Person.company))\
        .filter(models.FollowUp.status == "open", models.FollowUp.due_date == today)\
        .order_by(asc(models.FollowUp.id))\
        .all()
        
    # Upcoming (next 7 days)
    upcoming_tasks = db.query(models.FollowUp).options(joinedload(models.FollowUp.person).joinedload(models.Person.company))\
        .filter(models.FollowUp.status == "open", models.FollowUp.due_date > today)\
        .order_by(asc(models.FollowUp.due_date))\
        .limit(10).all()
        
    return {
        "overdue": overdue_tasks,
        "due_today": today_tasks,
        "upcoming": upcoming_tasks
    }

@router.post("/tasks/{task_id}/done")
def mark_task_done(task_id: int, db: Session = Depends(database.get_db)):
    task = db.query(models.FollowUp).filter(models.FollowUp.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "done"
    db.commit()
    return {"status": "success"}

@router.post("/tasks/{task_id}/snooze")
def snooze_task(task_id: int, days: int = 2, db: Session = Depends(database.get_db)):
    task = db.query(models.FollowUp).filter(models.FollowUp.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Simple snooze logic: add days to due_date
    from datetime import timedelta
    task.due_date = task.due_date + timedelta(days=days)
    db.commit()
    return {"status": "success", "new_date": task.due_date}

@router.post("/tasks/{task_id}/close")
def close_task(task_id: int, reason: str, db: Session = Depends(database.get_db)):
    task = db.query(models.FollowUp).filter(models.FollowUp.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.status = "closed"
    # Ideally verify person is also closed or log the reason?
    # For MVP just close the task.
    db.commit()
    return {"status": "success"}
