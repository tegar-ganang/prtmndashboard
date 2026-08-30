"""create project scurve tables

Revision ID: a1b2c3scurve1
Revises: a1b2c3lcv1
Create Date: 2026-08-29 15:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3scurve1"
down_revision = "a1b2c3lcv1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("IF OBJECT_ID('app.project_progress', 'U') IS NOT NULL DROP TABLE app.project_progress;")
    op.execute("IF OBJECT_ID('app.project_progress_summary', 'U') IS NOT NULL DROP TABLE app.project_progress_summary;")
    op.execute("IF OBJECT_ID('app.project_scurve_upload', 'U') IS NOT NULL DROP TABLE app.project_scurve_upload;")

    # 1. project_progress — latest snapshot only (Exe Sum sheet, per-discipline row)
    op.execute("""
        CREATE TABLE app.project_progress (
            id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            project_id              UNIQUEIDENTIFIER NOT NULL,
            periode_data            DATE             NOT NULL,

            item_no                 SMALLINT         NOT NULL,
            description             NVARCHAR(1000)   COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
            wf                      DECIMAL(10,2)    NULL,

            previous_week_plan      DECIMAL(10,2)    NULL,
            previous_week_actual    DECIMAL(10,2)    NULL,
            previous_week_variance  DECIMAL(10,2)    NULL,

            this_week_plan          DECIMAL(10,2)    NULL,
            this_week_actual        DECIMAL(10,2)    NULL,
            this_week_variance      DECIMAL(10,2)    NULL,

            to_date_plan            DECIMAL(10,2)    NULL,
            to_date_actual          DECIMAL(10,2)    NULL,
            to_date_variance        DECIMAL(10,2)    NULL,

            remarks                 NVARCHAR(2000)   COLLATE SQL_Latin1_General_CP1_CI_AS NULL,

            created_at              DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at              DATETIMEOFFSET   NULL,

            CONSTRAINT PK_project_progress PRIMARY KEY (id),
            CONSTRAINT FK_project_progress_project FOREIGN KEY (project_id)
                REFERENCES app.project(id) ON DELETE CASCADE,
            CONSTRAINT UQ_project_progress UNIQUE (project_id, periode_data, item_no)
        );
    """)

    # 2. project_progress_summary — full weekly date series (S-Overall sheet, transposed)
    op.execute("""
        CREATE TABLE app.project_progress_summary (
            id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            project_id          UNIQUEIDENTIFIER NOT NULL,
            progress_date       DATE             NOT NULL,

            actual_this_week    DECIMAL(10,2)    NULL,
            actual_cumulative   DECIMAL(10,2)    NULL,
            plan_this_week      DECIMAL(10,2)    NULL,
            plan_cumulative     DECIMAL(10,2)    NULL,
            variance_to_plan    DECIMAL(10,2)    NULL,

            created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
            updated_at          DATETIMEOFFSET   NULL,

            CONSTRAINT PK_project_progress_summary PRIMARY KEY (id),
            CONSTRAINT FK_project_progress_summary_project FOREIGN KEY (project_id)
                REFERENCES app.project(id) ON DELETE CASCADE,
            CONSTRAINT UQ_project_progress_summary UNIQUE (project_id, progress_date)
        );
    """)

    # 3. project_scurve_upload — permanent history of every uploaded file
    op.execute("""
        CREATE TABLE app.project_scurve_upload (
            id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
            project_id              UNIQUEIDENTIFIER NOT NULL,
            file_name               NVARCHAR(255)    COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
            file_path                NVARCHAR(500)    COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
            uploaded_by_account_id  UNIQUEIDENTIFIER NULL,
            uploaded_at             DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),

            CONSTRAINT PK_project_scurve_upload PRIMARY KEY (id),
            CONSTRAINT FK_project_scurve_upload_project FOREIGN KEY (project_id)
                REFERENCES app.project(id) ON DELETE CASCADE,
            CONSTRAINT FK_project_scurve_upload_account FOREIGN KEY (uploaded_by_account_id)
                REFERENCES app.account(id) ON DELETE SET NULL
        );
    """)

    op.execute("CREATE INDEX IX_project_progress_project ON app.project_progress (project_id);")
    op.execute("CREATE INDEX IX_project_progress_summary_project ON app.project_progress_summary (project_id);")
    op.execute("CREATE INDEX IX_project_scurve_upload_project ON app.project_scurve_upload (project_id, uploaded_at DESC);")


def downgrade() -> None:
    op.execute("IF OBJECT_ID('app.project_progress', 'U') IS NOT NULL DROP TABLE app.project_progress;")
    op.execute("IF OBJECT_ID('app.project_progress_summary', 'U') IS NOT NULL DROP TABLE app.project_progress_summary;")
    op.execute("IF OBJECT_ID('app.project_scurve_upload', 'U') IS NOT NULL DROP TABLE app.project_scurve_upload;")
