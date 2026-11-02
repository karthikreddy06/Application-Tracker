
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
from database import get_db
from models import Job, User
from schemas.job import JobCreate, JobUpdate, JobResponse
from security import get_current_user


router = APIRouter(
    prefix="/jobs",
    tags=["Job Applications"]
)


# ==========================================
# CREATE JOB APPLICATION
# ==========================================

@router.post(
    "/",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED
)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_job = Job(
        **job_data.model_dump(),
        user_id=current_user.id
    )

    try:
        db.add(new_job)
        db.commit()
        db.refresh(new_job)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create job application"
        )

    return new_job


# ==========================================
# GET ALL JOBS WITH SEARCH AND PAGINATION
# ==========================================

@router.get("/")
def get_jobs(
    job_status: str | None = Query(default=None, alias="status"),
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Job).filter(
        Job.user_id == current_user.id
    )

    if job_status:
        allowed_statuses = {
            "Applied",
            "Assessment",
            "Interview",
            "Offer",
            "Rejected"
        }

        if job_status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid job status"
            )

        query = query.filter(Job.status == job_status)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            Job.company_name.ilike(term) |
            Job.job_title.ilike(term)
        )

    total = query.count()

    jobs = (
        query.order_by(Job.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "has_more": (skip + len(jobs)) < total,
        "jobs": jobs
    }


# ==========================================
# DASHBOARD STATISTICS
# ==========================================

@router.get("/stats")
def get_job_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_jobs = db.query(Job).filter(
        Job.user_id == current_user.id
    )

    total = user_jobs.count()

    applied = user_jobs.filter(
        Job.status == "Applied"
    ).count()

    assessment = user_jobs.filter(
        Job.status == "Assessment"
    ).count()

    interview = user_jobs.filter(
        Job.status == "Interview"
    ).count()

    offers = user_jobs.filter(
        Job.status == "Offer"
    ).count()

    rejected = user_jobs.filter(
        Job.status == "Rejected"
    ).count()

    success_rate = (
        round((offers / total) * 100, 2)
        if total > 0 else 0
    )

    return {
        "total_applications": total,
        "applied": applied,
        "assessments": assessment,
        "interviews": interview,
        "offers": offers,
        "rejected": rejected,
        "success_rate": success_rate
    }

# ==========================================
# JOB FOLLOW-UP REMINDERS
# ==========================================

@router.get("/reminders")
def get_job_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    next_week = today + timedelta(days=7)

    active_statuses = ["Applied", "Assessment", "Interview"]

    base_query = db.query(Job).filter(
        Job.user_id == current_user.id,
        Job.follow_up_date.isnot(None),
        Job.status.in_(active_statuses)
    )

    overdue = base_query.filter(
        Job.follow_up_date < today
    ).order_by(Job.follow_up_date.asc()).all()

    due_today = base_query.filter(
        Job.follow_up_date == today
    ).order_by(Job.follow_up_date.asc()).all()

    upcoming = base_query.filter(
        Job.follow_up_date > today,
        Job.follow_up_date <= next_week
    ).order_by(Job.follow_up_date.asc()).all()

    return {
        "overdue_count": len(overdue),
        "due_today_count": len(due_today),
        "upcoming_count": len(upcoming),
        "total_reminders": (
            len(overdue) + len(due_today) + len(upcoming)
        ),
        "overdue": overdue,
        "due_today": due_today,
        "upcoming": upcoming
    }
# ==========================================
# GET ONE JOB APPLICATION
# ==========================================

@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )

    return job


# ==========================================
# UPDATE JOB APPLICATION
# ==========================================

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )

    update_data = job_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(job, field, value)

    try:
        db.commit()
        db.refresh(job)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update job application"
        )

    return job


# ==========================================
# DELETE JOB APPLICATION
# ==========================================

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )

    try:
        db.delete(job)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to delete job application"
        )

    return {
        "message": "Job application deleted successfully"
    }
