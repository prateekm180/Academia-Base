from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, Query, File, UploadFile, Cookie
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import requests
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from emergentintegrations.llm.chat import LlmChat, UserMessage
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Storage and AI config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = os.environ.get("APP_NAME", "academic-knowledge-platform")
storage_key = None

# Initialize storage
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: str
    name: str
    picture: Optional[str] = None
    bio: Optional[str] = None
    subjects: List[str] = []
    role: str = "student"
    is_mentor: bool = False
    is_public: bool = True
    follower_count: int = 0
    following_count: int = 0
    content_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    subjects: Optional[List[str]] = None
    is_public: Optional[bool] = None

class ContentBlock(BaseModel):
    block_id: str = Field(default_factory=lambda: f"block_{uuid.uuid4().hex[:8]}")
    title: str
    content: str
    order: int

class Content(BaseModel):
    model_config = ConfigDict(extra="ignore")
    content_id: str = Field(default_factory=lambda: f"content_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    description: str
    type: str  # note, pyq, sample_paper, video, explanation
    subject: str
    topic: str
    subtopic: Optional[str] = None
    level: str  # school, undergraduate, postgraduate
    tags: List[str] = []
    blocks: List[ContentBlock] = []
    file_refs: List[str] = []
    like_count: int = 0
    upvote_count: int = 0
    comment_count: int = 0
    version: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContentCreate(BaseModel):
    title: str
    description: str
    type: str
    subject: str
    topic: str
    subtopic: Optional[str] = None
    level: str
    tags: List[str] = []
    blocks: List[ContentBlock] = []

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    comment_id: str = Field(default_factory=lambda: f"comment_{uuid.uuid4().hex[:12]}")
    content_id: str
    user_id: str
    text: str
    type: str = "comment"  # comment, error_report, suggestion
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    text: str
    type: str = "comment"

class InteractionCreate(BaseModel):
    interaction_type: str  # like, upvote, star
    rating: Optional[int] = None

class AISummarizeRequest(BaseModel):
    content_id: str

class AISuggestRequest(BaseModel):
    subject: str
    topic: Optional[str] = None

# Auth helper
async def get_current_user(
    authorization: str = Header(None),
    session_token: str = Cookie(None)
) -> Optional[Dict]:
    token = None
    if session_token:
        token = session_token
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_doc

# Auth endpoints
@api_router.post("/auth/register")
async def register(input: UserRegister):
    existing = await db.users.find_one({"email": input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = bcrypt.hashpw(input.password.encode(), bcrypt.gensalt())
    user = User(email=input.email, name=input.name)
    user_dict = user.model_dump()
    user_dict["password_hash"] = hashed_password.decode()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "session_token": session_token,
        "user_id": user.user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response = Response(content='{"message": "User registered"}', media_type="application/json")
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    return response

@api_router.post("/auth/login")
async def login(input: UserLogin):
    user_doc = await db.users.find_one({"email": input.email})
    if not user_doc or not bcrypt.checkpw(input.password.encode(), user_doc["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_token = f"session_{uuid.uuid4().hex}"
    session_doc = {
        "session_token": session_token,
        "user_id": user_doc["user_id"],
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    response = Response(content='{"message": "Logged in"}', media_type="application/json")
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    return response

@api_router.post("/auth/session")
async def exchange_session(request: Request):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        resp = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        resp.raise_for_status()
        user_data = resp.json()
    except Exception as e:
        logger.error(f"Session exchange failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid session_id")
    
    existing_user = await db.users.find_one({"email": user_data["email"]})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture")}}
        )
    else:
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            picture=user_data.get("picture")
        )
        user_dict = user.model_dump()
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        await db.users.insert_one(user_dict)
        user_id = user.user_id
    
    session_token = user_data["session_token"]
    session_doc = {
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    
    response = Response(content=str(user_doc), media_type="application/json")
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    return user_doc

@api_router.get("/auth/me")
async def get_me(user=None):
    if user is None:
        user = await get_current_user()
    return {k: v for k, v in user.items() if k != "password_hash"}

@api_router.post("/auth/logout")
async def logout(session_token: str = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response = Response(content='{"message": "Logged out"}', media_type="application/json")
    response.delete_cookie("session_token", path="/")
    return response

# User endpoints
@api_router.get("/users/profile/{user_id}")
async def get_user_profile(user_id: str):
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user_doc.get("is_public", True):
        return {
            "user_id": user_doc["user_id"],
            "name": user_doc["name"],
            "is_public": False,
            "follower_count": user_doc.get("follower_count", 0),
            "following_count": user_doc.get("following_count", 0)
        }
    
    return user_doc

@api_router.put("/users/profile")
async def update_profile(input: UserUpdate, request: Request):
    user = await get_current_user(
        authorization=request.headers.get("authorization"),
        session_token=request.cookies.get("session_token")
    )
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

@api_router.post("/users/follow/{target_user_id}")
async def follow_user(target_user_id: str, request: Request):
    user = await get_current_user(
        authorization=request.headers.get("authorization"),
        session_token=request.cookies.get("session_token")
    )
    
    existing = await db.follows.find_one({
        "follower_id": user["user_id"],
        "following_id": target_user_id
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already following")
    
    await db.follows.insert_one({
        "follow_id": f"follow_{uuid.uuid4().hex[:12]}",
        "follower_id": user["user_id"],
        "following_id": target_user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"following_count": 1}})
    await db.users.update_one({"user_id": target_user_id}, {"$inc": {"follower_count": 1}})
    
    return {"message": "Followed successfully"}

@api_router.delete("/users/unfollow/{target_user_id}")
async def unfollow_user(target_user_id: str, request: Request):
    user = await get_current_user(
        authorization=request.headers.get("authorization"),
        session_token=request.cookies.get("session_token")
    )
    
    result = await db.follows.delete_one({
        "follower_id": user["user_id"],
        "following_id": target_user_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Not following")
    
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"following_count": -1}})
    await db.users.update_one({"user_id": target_user_id}, {"$inc": {"follower_count": -1}})
    
    return {"message": "Unfollowed successfully"}

# Content endpoints
@api_router.post("/content")
async def create_content(input: ContentCreate, request: Request):
    user = await get_current_user(
        authorization=request.headers.get("authorization"),
        session_token=request.cookies.get("session_token")
    )
    
    content = Content(user_id=user["user_id"], **input.model_dump())
    content_dict = content.model_dump()
    content_dict["created_at"] = content_dict["created_at"].isoformat()
    content_dict["updated_at"] = content_dict["updated_at"].isoformat()
    
    await db.content.insert_one(content_dict)
    await db.users.update_one({"user_id": user["user_id"]}, {"$inc": {"content_count": 1}})
    
    return content

@api_router.get("/content/{content_id}")
async def get_content(content_id: str):
    content_doc = await db.content.find_one({"content_id": content_id}, {"_id": 0})
    if not content_doc:
        raise HTTPException(status_code=404, detail="Content not found")
    
    user_doc = await db.users.find_one({"user_id": content_doc["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_mentor": 1})
    content_doc["author"] = user_doc
    
    return content_doc

@api_router.get("/content/search/query")
async def search_content(
    q: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    limit: int = Query(20, le=100)
):
    query = {}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}}
        ]
    if subject:
        query["subject"] = subject
    if topic:
        query["topic"] = topic
    if type:
        query["type"] = type
    if level:
        query["level"] = level
    
    contents = await db.content.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for content in contents:
        user_doc = await db.users.find_one({"user_id": content["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        content["author"] = user_doc
    
    return contents

@api_router.get("/content/discover/feed")
async def discover_content(limit: int = Query(20, le=100)):
    contents = await db.content.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for content in contents:
        user_doc = await db.users.find_one({"user_id": content["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_mentor": 1})
        content["author"] = user_doc
    
    return contents

@api_router.post("/content/{content_id}/interact")
async def interact_with_content(content_id: str, input: InteractionCreate, request: Request):
    user = await get_current_user(
        authorization=request.headers.get("authorization"),
        session_token=request.cookies.get("session_token")
    )
    
    existing = await db.interactions.find_one({
        "user_id": user["user_id"],
        "content_id": content_id,
        "interaction_type": input.interaction_type
    })
    
    if existing:
        await db.interactions.delete_one({"_id": existing["_id"]})
        if input.interaction_type == "like":
            await db.content.update_one({"content_id": content_id}, {"$inc": {"like_count": -1}})
        elif input.interaction_type == "upvote":
            await db.content.update_one({"content_id": content_id}, {"$inc": {"upvote_count": -1}})
        return {"message": "Interaction removed"}
    
    await db.interactions.insert_one({
        "interaction_id": f"int_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "content_id": content_id,
        "interaction_type": input.interaction_type,
        "rating": input.rating,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    if input.interaction_type == "like":
        await db.content.update_one({"content_id": content_id}, {"$inc": {"like_count": 1}})
    elif input.interaction_type == "upvote":
        await db.content.update_one({"content_id": content_id}, {"$inc": {"upvote_count": 1}})
    
    return {"message": "Interaction added"}

@api_router.get("/content/{content_id}/export-pdf")
async def export_content_as_pdf(content_id: str):
    content_doc = await db.content.find_one({"content_id": content_id}, {"_id": 0})
    if not content_doc:
        raise HTTPException(status_code=404, detail="Content not found")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    story.append(Paragraph(content_doc["title"], styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"Subject: {content_doc['subject']} | Topic: {content_doc['topic']}", styles["Normal"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph(content_doc["description"], styles["Normal"]))
    story.append(Spacer(1, 24))
    
    for block in content_doc.get("blocks", []):
        story.append(Paragraph(block["title"], styles["Heading2"]))
        story.append(Spacer(1, 6))
        story.append(Paragraph(block["content"], styles["Normal"]))
        story.append(Spacer(1, 12))
    
    doc.build(story)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={content_id}.pdf"}
    )

# Comment endpoints
@api_router.post("/content/{content_id}/comments")
async def create_comment(content_id: str, input: CommentCreate, request: Request):
    user = await get_current_user(
        authorization=request.headers.get("authorization"),
        session_token=request.cookies.get("session_token")
    )
    
    comment = Comment(content_id=content_id, user_id=user["user_id"], **input.model_dump())
    comment_dict = comment.model_dump()
    comment_dict["created_at"] = comment_dict["created_at"].isoformat()
    
    await db.comments.insert_one(comment_dict)
    await db.content.update_one({"content_id": content_id}, {"$inc": {"comment_count": 1}})
    
    return comment

@api_router.get("/content/{content_id}/comments")
async def get_comments(content_id: str, limit: int = Query(50, le=200)):
    comments = await db.comments.find({"content_id": content_id}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for comment in comments:
        user_doc = await db.users.find_one({"user_id": comment["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        comment["author"] = user_doc
    
    return comments

# Upload endpoint
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    user = await get_current_user(
        authorization=request.headers.get("authorization") if request else None,
        session_token=request.cookies.get("session_token") if request else None
    )
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    file_doc = {
        "file_id": f"file_{uuid.uuid4().hex[:12]}",
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "user_id": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    
    return {"file_id": file_doc["file_id"], "path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def download_file(path: str, request: Request):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# AI endpoints
@api_router.post("/ai/summarize")
async def ai_summarize(input: AISummarizeRequest, request: Request):
    user = await get_current_user(
        authorization=request.headers.get("authorization"),
        session_token=request.cookies.get("session_token")
    )
    
    content_doc = await db.content.find_one({"content_id": input.content_id}, {"_id": 0})
    if not content_doc:
        raise HTTPException(status_code=404, detail="Content not found")
    
    blocks_text = "\n\n".join([f"{b['title']}: {b['content']}" for b in content_doc.get("blocks", [])])
    prompt = f"Summarize this academic content:\n\nTitle: {content_doc['title']}\nSubject: {content_doc['subject']}\nTopic: {content_doc['topic']}\n\n{blocks_text}"
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"summary_{user['user_id']}",
        system_message="You are an academic assistant. Provide concise, clear summaries of educational content."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(text=prompt)
    response = await chat.send_message(message)
    
    return {"summary": response}

@api_router.post("/ai/suggest")
async def ai_suggest(input: AISuggestRequest, request: Request):
    user = await get_current_user(
        authorization=request.headers.get("authorization"),
        session_token=request.cookies.get("session_token")
    )
    
    prompt = f"Suggest 5 related topics or learning resources for: Subject: {input.subject}"
    if input.topic:
        prompt += f", Topic: {input.topic}"
    
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"suggest_{user['user_id']}",
        system_message="You are an academic advisor. Suggest relevant topics and resources for students."
    ).with_model("openai", "gpt-4o")
    
    message = UserMessage(text=prompt)
    response = await chat.send_message(message)
    
    return {"suggestions": response}

@api_router.get("/users/{user_id}/content")
async def get_user_content(user_id: str, limit: int = Query(20, le=100)):
    contents = await db.content.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return contents

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Startup failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
