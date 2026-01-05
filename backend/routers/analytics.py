from __future__ import annotations

from bisect import bisect_right
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

try:
    from .. import database, models
    from ..status import infer_direction, normalize_token
except ImportError:  # pragma: no cover
    import database, models  # type: ignore
    from status import infer_direction, normalize_token  # type: ignore


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _to_utc_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.get("/weekly")
def get_weekly_analytics(week_start: date | None = None, db: Session = Depends(database.get_db)):
    chicago = ZoneInfo("America/Chicago")

    if week_start is None:
        today = datetime.now(chicago).date()
        monday = today - timedelta(days=today.weekday())
    else:
        monday = week_start - timedelta(days=week_start.weekday())

    start_local = datetime.combine(monday, time.min).replace(tzinfo=chicago)
    end_local = start_local + timedelta(days=7)

    start_utc_naive = start_local.astimezone(timezone.utc).replace(tzinfo=None)
    end_utc_naive = end_local.astimezone(timezone.utc).replace(tzinfo=None)

    touchpoints = (
        db.query(models.Touchpoint)
        .filter(models.Touchpoint.date >= start_utc_naive, models.Touchpoint.date < end_utc_naive)
        .all()
    )

    day_keys = [monday + timedelta(days=i) for i in range(7)]
    sent_outbound = {d: 0 for d in day_keys}
    replies_inbound = {d: 0 for d in day_keys}
    recruiter_inmail = {d: 0 for d in day_keys}
    replies_attributed_to_sent_day = {d: 0 for d in day_keys}

    outbound_sent_by_person: dict[int, tuple[list[datetime], list[date]]] = {}

    for tp in touchpoints:
        dt_utc = _to_utc_aware(tp.date)
        dt_local = dt_utc.astimezone(chicago)
        day = dt_local.date()
        if day not in sent_outbound:
            continue

        direction = infer_direction(getattr(tp, "direction", None), tp.outcome)
        outcome = normalize_token(tp.outcome)
        channel = normalize_token(tp.channel)

        if direction == "outbound" and outcome == "sent":
            sent_outbound[day] += 1
            times, days = outbound_sent_by_person.setdefault(tp.person_id, ([], []))
            times.append(dt_utc)
            days.append(day)

        if direction == "inbound" and outcome == "replied":
            replies_inbound[day] += 1

        if direction == "inbound" and "inmail" in channel:
            recruiter_inmail[day] += 1

    for person_id, (times, days) in outbound_sent_by_person.items():
        if len(times) <= 1:
            continue
        zipped = sorted(zip(times, days), key=lambda x: x[0])
        outbound_sent_by_person[person_id] = ([t for t, _ in zipped], [d for _, d in zipped])

    for tp in touchpoints:
        direction = infer_direction(getattr(tp, "direction", None), tp.outcome)
        outcome = normalize_token(tp.outcome)
        if not (direction == "inbound" and outcome == "replied"):
            continue

        reply_dt = _to_utc_aware(tp.date)
        sent = outbound_sent_by_person.get(tp.person_id)
        if not sent:
            continue
        sent_times, sent_days = sent

        idx = bisect_right(sent_times, reply_dt) - 1
        if idx < 0:
            continue

        sent_dt = sent_times[idx]
        if reply_dt - sent_dt > timedelta(days=7):
            continue

        sent_day = sent_days[idx]
        if sent_day in replies_attributed_to_sent_day:
            replies_attributed_to_sent_day[sent_day] += 1

    return {
        "week_start": monday.isoformat(),
        "days": [
            {
                "date": d.isoformat(),
                "sent_outbound": sent_outbound[d],
                "replies_inbound": replies_inbound[d],
                "recruiter_inmail_inbound": recruiter_inmail[d],
                "replies_attributed_to_sent_day": replies_attributed_to_sent_day[d],
                "response_rate_by_sent_day": (
                    replies_attributed_to_sent_day[d] / sent_outbound[d]
                    if sent_outbound[d]
                    else 0.0
                ),
            }
            for d in day_keys
        ],
    }

