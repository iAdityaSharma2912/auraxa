"""Add token tracking columns to analyses table. Run once."""
import asyncio, os, sys
sys.path.insert(0, os.path.dirname(__file__))

async def migrate():
    from app.core.config import settings
    from sqlalchemy.ext.asyncio import create_async_engine
    from sqlalchemy import text

    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tokens_input INTEGER DEFAULT 0;"
        ))
        print("✓ tokens_input")
        await conn.execute(text(
            "ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tokens_output INTEGER DEFAULT 0;"
        ))
        print("✓ tokens_output")
        await conn.execute(text(
            "ALTER TABLE analyses ADD COLUMN IF NOT EXISTS tokens_total INTEGER DEFAULT 0;"
        ))
        print("✓ tokens_total")
    await engine.dispose()
    print("✓ Token migration complete")

if __name__ == "__main__":
    asyncio.run(migrate())
