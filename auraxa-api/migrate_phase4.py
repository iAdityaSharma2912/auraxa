"""
Phase 4 migration — adds promo_codes_used column to users table.
Run this ONCE after deploying Phase 4:

  python migrate_phase4.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))


async def migrate():
    from app.core.config import settings
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    engine = create_async_engine(settings.DATABASE_URL)

    async with engine.begin() as conn:
        # Add promo_codes_used column if it doesn't exist
        await conn.execute(text("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS promo_codes_used JSONB DEFAULT '[]'::jsonb;
        """))
        print("✓ Added promo_codes_used column to users table")

    await engine.dispose()
    print("✓ Phase 4 migration complete")


if __name__ == "__main__":
    asyncio.run(migrate())
