from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

_DB_PATH = (Path(__file__).resolve().parent / "outreach_ops.db").resolve()
SQLALCHEMY_DATABASE_URL = f"sqlite:///{_DB_PATH.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_SQLITE_REQUIRED_COLUMNS: dict[str, dict[str, str]] = {
    "touchpoints": {
        "direction": "TEXT",
    },
    "people": {
        "outreach_channels": "TEXT",
        "links": "TEXT",
    },
    "waitlist": {
        "outreach_channels": "TEXT",
        "links": "TEXT",
    },
}


def ensure_sqlite_columns(engine: Engine) -> None:
    """
    SQLite doesn't auto-migrate when SQLAlchemy models change.
    This adds new nullable columns in-place so existing DBs keep working.
    """
    if engine.dialect.name != "sqlite":
        return

    with engine.begin() as conn:
        for table_name, columns in _SQLITE_REQUIRED_COLUMNS.items():
            table_exists = conn.execute(
                text(
                    "SELECT 1 FROM sqlite_master WHERE type='table' AND name=:name LIMIT 1"
                ),
                {"name": table_name},
            ).first()
            if not table_exists:
                continue

            existing_columns = {
                row[1]
                for row in conn.exec_driver_sql(
                    f'PRAGMA table_info("{table_name}")'
                ).fetchall()
            }

            for column_name, sql_type in columns.items():
                if column_name in existing_columns:
                    continue
                conn.exec_driver_sql(
                    f'ALTER TABLE "{table_name}" ADD COLUMN "{column_name}" {sql_type}'
                )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
