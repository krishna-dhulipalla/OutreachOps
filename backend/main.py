from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import database
from models import Base
from routers import people, radar, dashboard, companies, waitlist

app = FastAPI(title="OutreachOps API")

@app.on_event("startup")
def _startup_init_db() -> None:
    Base.metadata.create_all(bind=database.engine)
    database.ensure_sqlite_columns(database.engine)

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
