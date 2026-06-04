#!/usr/bin/env python3
"""
Migration: add full_report JSONB column to analyses table
Run once:
  docker exec -it auraxa_api python migrate_full_report.py
"""
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings


async def migrate():
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE analyses
            ADD COLUMN IF NOT EXISTS full_report JSONB DEFAULT '{}';
        """))
        print("✓  full_report column added to analyses")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(migrate())
