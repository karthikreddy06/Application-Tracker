import os
from dotenv import load_dotenv

from email_service import send_email

load_dotenv()

recipient = input("Enter your email address to receive a test email: ")

try:
    send_email(
        to_email=recipient,
        subject="DevTrack - Email Test",
        body="""
Hello!

Your Gmail SMTP integration is working.

DevTrack can now send job application follow-up reminders.

Happy job hunting!

- DevTrack
"""
    )

    print("SUCCESS: Test email sent!")

except Exception as error:
    print("FAILED:", error)