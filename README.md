# AcademiaBase

AcademiaBase is a full-stack academic knowledge-sharing platform where students and mentors can publish, discover, and discuss study material — notes, previous-year questions (PYQs), sample papers, videos, and explanations — organized by subject, topic, and academic level.

## Features

- **Authentication** — Email/password signup & login, plus Google OAuth via Emergent Auth, with session cookies stored in MongoDB.
- **Content publishing** — Create structured content made of ordered blocks (title + body), tagged by type (`note`, `pyq`, `sample_paper`, `video`, `explanation`), subject, topic, subtopic, and academic level (`school`, `undergraduate`, `postgraduate`).
- **Discovery & search** — Full-text/query search over content plus a discovery feed for browsing new material.
- **Social layer** — Follow/unfollow users, like/upvote/star content, and comment on or report issues with content.
- **File handling** — Upload and download attachments (images, PDFs, etc.) backed by object storage.
- **PDF export** — Export any piece of content to a formatted PDF via ReportLab.
- **AI assistance** — AI-powered content summarization and topic/content suggestions via the Emergent LLM integration.
- **User profiles** — Public/private profiles with bio, subjects of interest, and content authored.

## Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) (Python) served with Uvicorn
- [MongoDB](https://www.mongodb.com/) via Motor (async) / PyMongo
- `bcrypt` for password hashing, `pyjwt` / `python-jose` for tokens
- `reportlab` for PDF generation
- `emergentintegrations` for LLM chat (AI summarize/suggest) and object storage

**Frontend**
- [React 19](https://react.dev/) with `react-router-dom` v7
- [CRACO](https://craco.js.org/) build tooling + Tailwind CSS
- Radix UI primitives / shadcn-style components, `lucide-react` icons
- `axios` for API calls, `recharts` for charts, `react-hook-form` + `zod` for forms

## Project Structure

```
Academia Base/
├── GOOGLE-AUTH-INTEGRATION.md   # Notes on the Google OAuth (Emergent Auth) flow
├── design-guidelines.json       # Design system: typography, colors, UI principles
├── backend/
│   ├── server.py                # FastAPI app: auth, users, content, comments, AI, files
│   ├── requirements.txt
│   └── .env                     # Backend environment variables
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.js               # Routes & auth guard
        ├── App.css / index.css
        └── pages/
            ├── LandingPage.js
            ├── Login.js
            ├── Signup.js
            ├── Dashboard.js
            ├── Profile.js
            ├── CreateContent.js
            ├── ContentDetail.js
            └── Search.js
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ and Yarn
- A running MongoDB instance

### Backend Setup

```bash
cd app/backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `app/backend/` with:

```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY="<your-emergent-llm-key>"
APP_NAME="academic-knowledge-platform"
```

Run the API:

```bash
uvicorn server:app --reload --port 8000
```

### Frontend Setup

```bash
cd app/frontend
yarn install
```

Create a `.env` file in `app/frontend/` with:

```
REACT_APP_BACKEND_URL="http://localhost:8000"
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

Run the dev server:

```bash
yarn start
```

The app will be available at `http://localhost:3000`, calling the API at the `REACT_APP_BACKEND_URL` you configured (all API routes are prefixed with `/api`).

## Authentication

- **Email/password**: standard signup/login endpoints (`/api/auth/register`, `/api/auth/login`), passwords hashed with bcrypt.
- **Google OAuth**: handled through Emergent Auth — the user is redirected to `auth.emergentagent.com`, and on return the frontend exchanges a `session_id` for a `session_token` via `/api/auth/session`. Sessions last 7 days and are stored as httpOnly cookies in MongoDB. See `GOOGLE-AUTH-INTEGRATION.md` for the full flow.

## API Overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/session`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Users | `GET /api/users/profile/{user_id}`, `PUT /api/users/profile`, `POST /api/users/follow/{id}`, `DELETE /api/users/unfollow/{id}`, `GET /api/users/{user_id}/content` |
| Content | `POST /api/content`, `GET /api/content/{id}`, `GET /api/content/search/query`, `GET /api/content/discover/feed`, `POST /api/content/{id}/interact`, `GET /api/content/{id}/export-pdf` |
| Comments | `POST /api/content/{id}/comments`, `GET /api/content/{id}/comments` |
| Files | `POST /api/upload`, `GET /api/files/{path}` |
| AI | `POST /api/ai/summarize`, `POST /api/ai/suggest` |

## Design System

Visual and typographic guidelines live in `app/design-guidelines.json`. The design targets a "digital library" feel — serif headings (Playfair Display), sans-serif body text (Inter), a deep teal / paper-white / highlighter-orange palette, and structure-over-decoration UI principles, with a supported dark mode palette.

## Notes

- The `.env` files in this repo contain placeholder/development values — replace `EMERGENT_LLM_KEY`, `MONGO_URL`, and `REACT_APP_BACKEND_URL` with your own values before deploying, and never commit real secrets to version control.
- `memory/test-credentials.md` documents dummy test accounts and the OAuth flow for QA purposes only.
