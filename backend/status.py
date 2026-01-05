from __future__ import annotations

from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from . import models
except ImportError:  # pragma: no cover
    import models  # type: ignore


def normalize_token(value: Optional[str]) -> str:
    return (value or "").strip().lower()


def outcome_is_closed(outcome: Optional[str]) -> bool:
    token = normalize_token(outcome)
    if not token:
        return False
    if token == "closed":
        return True
    if token in {"not_interested", "not interested"}:
        return True
    if token.startswith("closed"):
        return True
    if "not interested" in token:
        return True
    return False


def normalize_direction(value: Optional[str]) -> Optional[str]:
    token = normalize_token(value)
    if not token:
        return None
    if token in {"outbound", "out"}:
        return "outbound"
    if token in {"inbound", "in"}:
        return "inbound"
    if token in {"other", "unknown"}:
        return "other"
    return token


def infer_direction(value: Optional[str], outcome: Optional[str]) -> str:
    normalized = normalize_direction(value)
    if normalized:
        return normalized

    outcome_token = normalize_token(outcome)
    if outcome_token == "sent":
        return "outbound"
    if outcome_token in {"replied", "reply"}:
        return "inbound"
    return "other"


def close_person(person: models.Person, db: Session) -> None:
    person.status = "closed"
    for follow_up in (
        db.query(models.FollowUp)
        .filter(models.FollowUp.person_id == person.id, models.FollowUp.status == "open")
        .all()
    ):
        follow_up.status = "closed"


def reconcile_people_statuses(db: Session) -> int:
    """
    Best-effort consistency pass for SQLite DBs:
    - If a person has any touchpoint outcome == 'closed', ensure person.status == 'closed'
    - If a person.status == 'closed', ensure all open follow-ups are closed
    """

    updated_count = 0

    outcome_lower = func.lower(func.coalesce(models.Touchpoint.outcome, ""))
    closed_from_touchpoints = {
        person_id
        for (person_id,) in (
            db.query(models.Touchpoint.person_id)
            .filter(
                (outcome_lower == "closed")
                | (outcome_lower == "not_interested")
                | (outcome_lower.like("closed%"))
                | (outcome_lower.like("%not interested%"))
            )
            .distinct()
            .all()
        )
    }

    people = db.query(models.Person).all()
    for person in people:
        should_be_closed = person.id in closed_from_touchpoints
        is_closed = normalize_token(person.status) == "closed"

        if should_be_closed and not is_closed:
            close_person(person, db)
            updated_count += 1
            continue

        if is_closed:
            close_person(person, db)

    db.commit()

    return updated_count


def backfill_touchpoint_directions(db: Session) -> int:
    updated = 0
    for tp in db.query(models.Touchpoint).all():
        desired = infer_direction(tp.direction, tp.outcome)
        if normalize_direction(tp.direction) != desired:
            tp.direction = desired
            updated += 1
    if updated:
        db.commit()
    return updated
