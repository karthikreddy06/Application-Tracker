from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    Text,
    Date,
    DateTime,
    UniqueConstraint,
    func,
)

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    company_name = Column(String(150), nullable=False)
    job_title = Column(String(150), nullable=False)
    location = Column(String(150), nullable=True)
    job_type = Column(String(50), nullable=True)
    status = Column(String(30), nullable=False, default="Applied")
    job_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    follow_up_date = Column(Date, nullable=True)


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    __table_args__ = (
        UniqueConstraint(
            "job_id",
            "reminder_type",
            "reminder_date",
            name="uq_job_reminder_date"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    reminder_type = Column(String(30), nullable=False)

    reminder_date = Column(Date, nullable=False)

    sent_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )