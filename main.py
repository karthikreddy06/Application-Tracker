
from contextlib import asynccontextmanager

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException

from database import engine, Base, test_database_connection
import models

from routers import auth, jobs

from reminder_scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)

    # Start daily email reminder scheduler
    start_scheduler()

    print("DevTrack API started successfully.")

    yield

    # Stop scheduler during application shutdown
    stop_scheduler()

    print("DevTrack API stopped.")


app = FastAPI(
    title="DevTrack API",
    description="Developer Job Application and Productivity Tracker",
    version="1.0.0",
    lifespan=lifespan
)


# API Routers
app.include_router(auth.router)
app.include_router(jobs.router)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174"
    ],
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
