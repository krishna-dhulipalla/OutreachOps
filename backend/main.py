from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routers import people, radar, dashboard, companies, waitlist

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OutreachOps API")

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(people.router)
app.include_router(radar.router)
app.include_router(dashboard.router)
app.include_router(companies.router)
app.include_router(waitlist.router)

@app.get("/")
def read_root():
    return {"message": "OutreachOps Backend Running"}
