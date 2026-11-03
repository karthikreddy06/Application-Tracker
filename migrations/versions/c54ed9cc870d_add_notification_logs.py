
"""add notification logs"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "c54ed9cc870d"
down_revision: Union[str, Sequence[str], None] = "eaa11e9437b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("job_id", sa.Integer(), nullable=False),
        sa.Column("reminder_type", sa.String(length=30), nullable=False),
        sa.Column("reminder_date", sa.Date(), nullable=False),
        sa.Column(
            "sent_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["job_id"],
            ["jobs.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "job_id",
            "reminder_type",
            "reminder_date",
            name="uq_job_reminder_date",
        ),
    )

    op.create_index(
        "ix_notification_logs_id",
        "notification_logs",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_notification_logs_user_id",
        "notification_logs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_notification_logs_job_id",
        "notification_logs",
        ["job_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_notification_logs_job_id", table_name="notification_logs")
    op.drop_index("ix_notification_logs_user_id", table_name="notification_logs")
    op.drop_index("ix_notification_logs_id", table_name="notification_logs")
    op.drop_table("notification_logs")
