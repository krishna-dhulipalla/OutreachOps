# OutreachOps

A personal outreach tracking application for job search and networking.

## Features

- **People Management**: Track contacts, relationships, and status.
- **Touchpoints**: Log interactions (LinkedIn, Email, etc.) and outcomes.
- **Follow-up Inbox**: "Today" dashboard showing overdue and upcoming tasks.
- **Companies**: Automatically organized view of contacts by company.
- **Waitlist**: Track target companies and people for future outreach.
- **Radar**: H-1B and tech hiring news feed with "Save to Waitlist".

## Tech Stack

- **Backend**: Python, FastAPI, SQLite, SQLAlchemy
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, TanStack Query

## Prerequisites

- Python 3.9+
- Node.js 16+

## Setup

1. **Backend Setup**:

   ```bash
   cd backend
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   # source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

Use the provided `run.py` script for convenience:

```bash
# Run everything (Backend + Frontend)
python run.py --all

# Run only Backend
python run.py --backend

# Run only Frontend
python run.py --frontend
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

## License

Personal usage.
