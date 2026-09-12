import sys, asyncio, os, traceback
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base, engine
from sqlalchemy import select, func
from app.services.seed_service import seed_database


async def go():
    print("DATABASE_URL =", settings.DATABASE_URL, flush=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as s:
        try:
            await seed_database(s)
            print("SEED OK", flush=True)
            from app.models.car import Car
            from app.models.user import User
            cars = (await s.execute(select(func.count(Car.id)))).scalar_one()
            users = (await s.execute(select(func.count(User.id)))).scalar_one()
            print(f"cars={cars} users={users}", flush=True)
        except Exception:
            traceback.print_exc()


asyncio.run(go())