"""
Phase 4 UI Refresh migration
------------------------------
Adds profile_meta JSONB column to users table for
bio, dob, location, gender.

Run once:
  $env:DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5433/auraxa"
  python migrate_profile.py
"""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))


async def migrate():
    from app.core.config import settings
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS profile_meta JSONB DEFAULT '{}'::jsonb;
        """))
        print("✓ Added profile_meta column to users table")
    await engine.dispose()
    print("✓ Migration complete")


if __name__ == "__main__":
    asyncio.run(migrate())
