from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Date
from sqlalchemy.orm import relationship as sql_relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    sponsor_status = Column(String)  # 'yes', 'no', 'unknown'
    notes = Column(Text, nullable=True)
    
    contacts = sql_relationship("Person", back_populates="company")

class Person(Base):
    __tablename__ = "people"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    linkedin_url = Column(String, nullable=True)
    relationship = Column(String)  # 'cold', 'warm', 'alumni', 'recruiter', 'referral'
    why_reached_out = Column(Text, nullable=False)
    sponsor_confidence = Column(String, default="unknown")  # 'yes', 'no', 'unknown'
    status = Column(String, default="open")  # 'open', 'waiting', 'closed'
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # New fields
    outreach_channels = Column(Text, nullable=True) # JSON list of strings or comma-separated
    links = Column(Text, nullable=True) # JSON list of strings or comma-separated

    company = sql_relationship("Company", back_populates="contacts")
    touchpoints = sql_relationship("Touchpoint", back_populates="person", cascade="all, delete-orphan")
    follow_ups = sql_relationship("FollowUp", back_populates="person", cascade="all, delete-orphan")

class Touchpoint(Base):
    __tablename__ = "touchpoints"
    
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("people.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    channel = Column(String, nullable=False)  # 'LinkedIn DM', 'email', etc.
    outcome = Column(String)  # 'sent', 'replied'
    message_preview = Column(Text, nullable=True)
    next_step_action = Column(String, nullable=True)
    
    person = sql_relationship("Person", back_populates="touchpoints")

class FollowUp(Base):
    __tablename__ = "follow_ups"
    
    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(Integer, ForeignKey("people.id"), nullable=False)
    due_date = Column(Date, nullable=False)
    action = Column(String, nullable=False)
    status = Column(String, default="open")  # 'open', 'done', 'snoozed', 'closed'
    
    person = sql_relationship("Person", back_populates="follow_ups")

class Waitlist(Base):
    __tablename__ = "waitlist"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True) # Person name or placeholder
    company = Column(String, nullable=False)
    planned_action_date = Column(Date, nullable=True)
    reason = Column(String, nullable=True)
    priority = Column(String, default="B") # A, B, C
    status = Column(String, default="active")
    
    # New fields match Person for easy conversion
    outreach_channels = Column(Text, nullable=True) # JSON/String
    links = Column(Text, nullable=True) # JSON/String
