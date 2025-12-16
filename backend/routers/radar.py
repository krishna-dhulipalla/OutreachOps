from fastapi import APIRouter
import feedparser
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/radar", tags=["radar"])

class NewsItem(BaseModel):
    title: str
    link: str
    source: str
    published: str
    snippet: str

@router.get("/", response_model=List[NewsItem])
def get_radar_news(query: str = "H-1B sponsor hiring"):
    # Google News RSS URL
    rss_url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
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
