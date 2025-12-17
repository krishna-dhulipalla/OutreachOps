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

class PersonSimple(BaseModel):
    id: int
    name: str
    title: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class Company(CompanyBase):
    id: int
    contacts: List[PersonSimple] = []
    contact_count: Optional[int] = 0
    last_touch_date: Optional[str] = None
    next_follow_up_date: Optional[str] = None
    
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
    # New fields
    outreach_channels: Optional[str] = None # JSON string
    links: Optional[str] = None # JSON string

class PersonCreate(PersonBase):
    company_name: str  # Handle company creation/linking in logic
    create_initial_followup: Optional[bool] = False # Flag for creating initial follow-up
    initial_followup_days: Optional[int] = 2

class PersonUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    linkedin_url: Optional[str] = None
    relationship: Optional[str] = None
    why_reached_out: Optional[str] = None
    sponsor_confidence: Optional[str] = None
    status: Optional[str] = None
    title: Optional[str] = None
    outreach_channels: Optional[str] = None
    links: Optional[str] = None

class Person(PersonBase):
    id: int
    company_id: int
    created_at: datetime
    company: Company
    touchpoints: List[Touchpoint] = []
    follow_ups: List[FollowUp] = []
    
    model_config = ConfigDict(from_attributes=True)
