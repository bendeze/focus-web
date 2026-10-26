from typing import Generator
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings
from sqlalchemy import text

db_url = settings.SQLALCHEMY_DATABASE_URI

connect_args = {}
engine_kwargs = {"echo": False}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL connection pool settings for cloud environments like Neon
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,
    })

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs,
)


def init_db() -> None:
    # Ensure all models are registered with SQLModel metadata
    import app.models  # noqa: F401

    # Auto-migrate: check if existing SQLite tables have outdated INTEGER primary keys
    if db_url.startswith("sqlite"):
        with engine.begin() as conn:
            table_info = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            if table_info:
                id_col = next((col for col in table_info if col[1] == "id"), None)
                # If users.id is INTEGER, drop outdated tables to recreate with UUID
                if id_col and "INT" in str(id_col[2]).upper():
                    conn.execute(text("DROP TABLE IF EXISTS focus_sessions"))
                    conn.execute(text("DROP TABLE IF EXISTS tasks"))
                    conn.execute(text("DROP TABLE IF EXISTS projects"))
                    conn.execute(text("DROP TABLE IF EXISTS users"))

    # Create tables if they do not exist
    SQLModel.metadata.create_all(engine)

    # Ensure soft-delete columns exist on existing databases
    with engine.begin() as conn:
        if db_url.startswith("sqlite"):
            # Ensure users table has role and is_admin
            u_cols = [c[1] for c in conn.execute(text("PRAGMA table_info(users)")).fetchall()]
            if u_cols and "is_admin" not in u_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT 0"))
            if u_cols and "role" not in u_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'user'"))

            for tbl in ["projects", "tasks", "focus_sessions"]:
                cols = [c[1] for c in conn.execute(text(f"PRAGMA table_info({tbl})")).fetchall()]
                if cols and "is_deleted" not in cols:
                    conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT 0"))
                if cols and "deleted_at" not in cols:
                    conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN deleted_at DATETIME NULL"))
        else:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR NOT NULL DEFAULT 'user'"))
            for tbl in ["projects", "tasks", "focus_sessions"]:
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE"))
                conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL"))




def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

