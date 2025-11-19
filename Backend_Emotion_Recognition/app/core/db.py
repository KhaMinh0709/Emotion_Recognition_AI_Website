import json
from sqlalchemy import (
    create_engine,
    MetaData,
    Table,
    Column,
    Integer,
    String,
    DateTime,
    Text,
    func,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.pool import NullPool
from fastapi.concurrency import run_in_threadpool
from app.core.config import settings
from app.core.logger import setup_logger

logger = setup_logger(__name__)


# Create engine
_url = settings.get_sqlalchemy_url()
engine = create_engine(_url, echo=settings.DB_ECHO, poolclass=NullPool)
metadata = MetaData()

# Results table: store JSON payload as text
results_table = Table(
    "results",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("source", String(50), nullable=False),
    Column("timestamp", DateTime, server_default=func.now(), nullable=False),
    Column("payload", Text, nullable=False),
    Column("metadata", Text, nullable=True),
)


def init_db():
    """Create tables if they don't exist."""
    try:
        metadata.create_all(bind=engine)
        logger.info("Database tables ensured (results table)")
    except SQLAlchemyError as e:
        logger.error(f"Could not initialize DB: {e}")


def _save_result_sync(source: str, payload: dict, metadata_obj: dict | None = None) -> int | None:
    try:
        with engine.begin() as conn:
            ins = results_table.insert().values(
                source=source,
                payload=json.dumps(payload, ensure_ascii=False),
                metadata=json.dumps(metadata_obj, ensure_ascii=False) if metadata_obj else None,
            )
            result = conn.execute(ins)
            # result.inserted_primary_key may be DB-specific
            try:
                pk = result.inserted_primary_key[0]
            except Exception:
                pk = None
            return pk
    except SQLAlchemyError as e:
        logger.error(f"DB insert error: {e}")
        return None


async def save_result(source: str, payload: dict, metadata_obj: dict | None = None) -> int | None:
    """Async wrapper that runs DB insert in threadpool to avoid blocking event loop."""
    return await run_in_threadpool(_save_result_sync, source, payload, metadata_obj)


# Ensure tables created at import time (no-op if already exists)
try:
    init_db()
except Exception:
    # initialization errors are already logged inside init_db
    pass
