
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from database import SessionLocal
from models import Job, User, NotificationLog
from email_service import send_email


# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TIMEZONE = ZoneInfo("Asia/Kolkata")

scheduler = BackgroundScheduler(timezone=TIMEZONE)


def send_job_reminder(db, job, user, reminder_type):
    """Send one reminder and record successful delivery."""

    existing = db.query(NotificationLog).filter(
        NotificationLog.job_id == job.id,
        NotificationLog.reminder_type == reminder_type,
        NotificationLog.reminder_date == job.follow_up_date
    ).first()

    if existing:
        logger.info(
            "Reminder already sent: job=%s type=%s",
            job.id,
            reminder_type
        )
        return

    subjects = {
        "upcoming": "DevTrack - Follow-up Tomorrow",
        "due_today": "DevTrack - Follow-up Due Today",
        "overdue": "DevTrack - Overdue Follow-up"
    }

    messages = {
        "upcoming": "Your job application follow-up is scheduled for tomorrow.",
        "due_today": "Your job application follow-up is scheduled for today.",
        "overdue": "Your scheduled job application follow-up date has passed."
    }

    follow_up_date = job.follow_up_date.strftime("%d %B %Y")

    body = f"""
Hello {user.full_name},

{messages[reminder_type]}

Job Application Details
-----------------------
Company: {job.company_name}
Position: {job.job_title}
Location: {job.location or "Not specified"}
Status: {job.status}
Follow-up Date: {follow_up_date}

Please take the necessary action for this application.

Manage your applications in DevTrack.

Happy job hunting!

- DevTrack
"""

    try:
        send_email(
            to_email=user.email,
            subject=subjects[reminder_type],
            body=body
        )

        # Record only after successful email delivery.
        log = NotificationLog(
            user_id=user.id,
            job_id=job.id,
            reminder_type=reminder_type,
            reminder_date=job.follow_up_date
        )

        db.add(log)
        db.commit()

        logger.info(
            "Email sent successfully to %s for %s",
            user.email,
            job.company_name
        )

    except Exception:
        db.rollback()

        logger.exception(
            "Failed to send reminder for job ID %s",
            job.id
        )


def check_job_reminders():
    """Check all users' applications and send required reminders."""

    db = SessionLocal()

    try:
        today = datetime.now(TIMEZONE).date()
        tomorrow = today + timedelta(days=1)

        active_statuses = [
            "Applied",
            "Assessment",
            "Interview"
        ]

        reminder_groups = [
            ("upcoming", tomorrow),
            ("due_today", today),
            ("overdue", today - timedelta(days=1))
        ]

        for reminder_type, target_date in reminder_groups:

            query = db.query(Job, User).join(
                User,
                Job.user_id == User.id
            ).filter(
                Job.follow_up_date == target_date
                if reminder_type != "overdue"
                else Job.follow_up_date < today,
                Job.status.in_(active_statuses),
                User.is_active.is_(True)
            )

            results = query.all()

            logger.info(
                "Found %s %s reminders",
                len(results),
                reminder_type
            )

            for job, user in results:
                send_job_reminder(
                    db,
                    job,
                    user,
                    reminder_type
                )

        logger.info("Daily reminder check completed.")

    except Exception:
        db.rollback()
        logger.exception("Reminder scheduler failed.")

    finally:
        db.close()


def start_scheduler():
    """Start the daily reminder scheduler."""

    if scheduler.running:
        return

    scheduler.add_job(
        check_job_reminders,
        trigger=CronTrigger(
            hour=9,
            minute=0,
            timezone=TIMEZONE
        ),
        id="daily_job_reminders",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600
    )

    scheduler.start()

    logger.info(
        "DevTrack reminder scheduler started. "
        "Daily execution: 9:00 AM IST."
    )


def stop_scheduler():
    """Stop the scheduler safely."""

    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("DevTrack reminder scheduler stopped.")
