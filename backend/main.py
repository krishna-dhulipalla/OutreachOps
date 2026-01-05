from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
from starlette.staticfiles import StaticFiles

# Support running as a package (`uvicorn backend.main:app`) and as a module from
# within `backend/` (`uvicorn main:app`).
try:
    from . import database
    from .models import Base
    from .status import backfill_touchpoint_directions, reconcile_people_statuses
    from .routers import analytics, people, radar, dashboard, companies, waitlist
except ImportError:  # pragma: no cover
    import database  # type: ignore
    from models import Base  # type: ignore
    from status import backfill_touchpoint_directions, reconcile_people_statuses  # type: ignore
    from routers import analytics, people, radar, dashboard, companies, waitlist  # type: ignore

app = FastAPI(title="OutreachOps API")

@app.on_event("startup")
def _startup_init_db() -> None:
    Base.metadata.create_all(bind=database.engine)
    database.ensure_sqlite_columns(database.engine)

    db = database.SessionLocal()
    try:
        backfill_touchpoint_directions(db)
        reconcile_people_statuses(db)
    finally:
        db.close()

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(people.router)
app.include_router(radar.router)
app.include_router(dashboard.router)
app.include_router(companies.router)
app.include_router(waitlist.router)
app.include_router(analytics.router)

_FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if _FRONTEND_DIST.exists():
    _assets_dir = _FRONTEND_DIST / "assets"
    if _assets_dir.exists():
        app.mount(
            "/assets",
            StaticFiles(directory=_assets_dir),
            name="frontend-assets",
        )

    @app.get("/", include_in_schema=False)
    def _serve_index():
        return FileResponse(_FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    def _serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not Found")

        candidate = _FRONTEND_DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_FRONTEND_DIST / "index.html")
else:

    @app.get("/")
    def read_root():
        return {"message": "OutreachOps Backend Running"}
