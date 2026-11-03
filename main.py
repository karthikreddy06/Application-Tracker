
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import test_database_connection
from routers import auth, jobs

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("DevTrack API started successfully.")
    yield
    print("DevTrack API stopped.")


app = FastAPI(
    title="DevTrack API",
    description="Developer Job Application and Productivity Tracker",
    version="1.0.0",
    lifespan=lifespan
)


app.include_router(auth.router)
app.include_router(jobs.router)


# CORS Configuration
frontend_urls = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173,http://localhost:5174"
)

allowed_origins = [
    url.strip()
    for url in frontend_urls.split(",")
    if url.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Welcome to DevTrack API",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "DevTrack"
    }


@app.get("/db-health")
def database_health():
    try:
        test_database_connection()

        return {
            "database": "PostgreSQL",
            "status": "connected"
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(error)}"
        )
