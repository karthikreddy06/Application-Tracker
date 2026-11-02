
from datetime import datetime, date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


JobStatus = Literal[
    "Applied",
    "Assessment",
    "Interview",
    "Offer",
    "Rejected"
]


class JobCreate(BaseModel):
    company_name: str = Field(min_length=2, max_length=150)
    job_title: str = Field(min_length=2, max_length=150)
    location: str | None = None
    job_type: str | None = None
    status: JobStatus = "Applied"
    job_url: str | None = None
    notes: str | None = None
    follow_up_date: date | None = None


class JobUpdate(BaseModel):
    company_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )
    job_title: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )
    location: str | None = None
    job_type: str | None = None
    status: JobStatus | None = None
    job_url: str | None = None
    notes: str | None = None
    follow_up_date: date | None = None


class JobResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    job_title: str
    location: str | None
    job_type: str | None
    status: str
    job_url: str | None
    notes: str | None
    created_at: datetime
    follow_up_date: date | None

    model_config = ConfigDict(from_attributes=True)
