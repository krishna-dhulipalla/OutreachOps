from fastapi import APIRouter
import feedparser
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import calendar
from urllib.parse import quote_plus

router = APIRouter(prefix="/api/radar", tags=["radar"])

class NewsItem(BaseModel):
    title: str
    link: str
    source: str
    published: str
    snippet: str

@router.get("", response_model=List[NewsItem])
def get_radar_news(query: str = "H-1B sponsor hiring", days: int = 2, limit: int = 20):
    # Google News RSS URL
    safe_query_text = (query or "").strip() or "H-1B sponsor hiring"
    days = max(1, min(int(days), 30))
    limit = max(1, min(int(limit), 50))

    # Bias results to recent items. Google News supports 'when:Xd' in the query.
    safe_query = quote_plus(f"{safe_query_text} when:{days}d")
    rss_url = (
        f"https://news.google.com/rss/search?q={safe_query}&hl=en-US&gl=US&ceid=US:en"
    )
    feed = feedparser.parse(rss_url)
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    parsed_items: list[tuple[datetime, NewsItem]] = []

    for entry in getattr(feed, "entries", [])[: 5 * limit]:
        published_dt: Optional[datetime] = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            published_dt = datetime.fromtimestamp(
                calendar.timegm(entry.published_parsed), tz=timezone.utc
            )

        if published_dt is None or published_dt < cutoff:
            continue

        parsed_items.append(
            (
                published_dt,
                NewsItem(
                    title=getattr(entry, "title", ""),
                    link=getattr(entry, "link", ""),
                    source=entry.source.title
                    if hasattr(entry, "source") and hasattr(entry.source, "title")
                    else "Unknown",
                    published=getattr(entry, "published", ""),
                    snippet=getattr(entry, "summary", ""),
                ),
            )
        )

    parsed_items.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in parsed_items[:limit]]
