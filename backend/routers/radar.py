from fastapi import APIRouter
import feedparser
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from urllib.parse import quote_plus

router = APIRouter(prefix="/api/radar", tags=["radar"])

class NewsItem(BaseModel):
    title: str
    link: str
    source: str
    published: str
    snippet: str

@router.get("", response_model=List[NewsItem])
def get_radar_news(query: str = "H-1B sponsor hiring"):
    # Google News RSS URL
    safe_query = quote_plus((query or "").strip() or "H-1B sponsor hiring")
    rss_url = f"https://news.google.com/rss/search?q={safe_query}&hl=en-US&gl=US&ceid=US:en"
    feed = feedparser.parse(rss_url)
    
    items = []
    for entry in feed.entries[:20]:
        items.append(NewsItem(
            title=entry.title,
            link=entry.link,
            source=entry.source.title if hasattr(entry, 'source') else "Unknown",
            published=entry.published if hasattr(entry, 'published') else "",
            snippet=entry.summary if hasattr(entry, 'summary') else ""
        ))
    return items
