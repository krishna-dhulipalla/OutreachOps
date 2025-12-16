from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, date

# --- Company ---
class CompanyBase(BaseModel):
    name: str
    sponsor_status: Optional[str] = "unknown"
    notes: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- Touchpoint ---
class TouchpointBase(BaseModel):
    date: datetime
    channel: str
    outcome: Optional[str] = None
    message_preview: Optional[str] = None
    next_step_action: Optional[str] = None
    next_step_date: Optional[date] = None

class TouchpointCreate(TouchpointBase):
    pass

class Touchpoint(TouchpointBase):
    id: int
    person_id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- FollowUp ---
class FollowUpBase(BaseModel):
    due_date: date
    action: str
    status: str = "open"

class FollowUpCreate(FollowUpBase):
    pass

class FollowUp(FollowUpBase):
    id: int
    person_id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- Person ---
class PersonBase(BaseModel):
    name: str
    linkedin_url: Optional[str] = None
    relationship: Optional[str] = "cold"
    why_reached_out: str
    sponsor_confidence: Optional[str] = "unknown"
    status: Optional[str] = "open"
    title: Optional[str] = None

class PersonCreate(PersonBase):
    company_name: str  # Handle company creation/linking in logic

class Person(PersonBase):
    id: int
    company_id: int
    created_at: datetime
    company: Company
    touchpoints: List[Touchpoint] = []
    follow_ups: List[FollowUp] = []
    
    model_config = ConfigDict(from_attributes=True)
