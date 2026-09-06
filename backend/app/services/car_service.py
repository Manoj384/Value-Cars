import math
import uuid
from typing import Optional, Tuple, List
from sqlalchemy import func, select, desc, asc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.car import Car, CarImage, CarFeature, CarStatus
from app.schemas.car import CarCreate, CarUpdate, CarFilterParams


class CarService:
    @staticmethod
    async def get_car_by_id(db: AsyncSession, car_id: uuid.UUID) -> Optional[Car]:
        """Fetch single car with loaded images and features."""
        query = (
            select(Car)
            .where(Car.id == car_id)
            .options(selectinload(Car.images), selectinload(Car.features))
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_cars(
        db: AsyncSession,
        filters: CarFilterParams,
    ) -> Tuple[List[Car], int, int]:
        """Query cars with dynamic multi-criteria filtering and pagination."""
        query = select(Car).options(
            selectinload(Car.images),
            selectinload(Car.features),
        )

        # Filters
        if filters.make:
            query = query.where(Car.make.ilike(f"%{filters.make.strip()}%"))
        if filters.model:
            query = query.where(Car.model.ilike(f"%{filters.model.strip()}%"))
        if filters.city:
            query = query.where(Car.city.ilike(f"%{filters.city.strip()}%"))
        if filters.fuel_type:
            query = query.where(Car.fuel_type == filters.fuel_type)
        if filters.transmission:
            query = query.where(Car.transmission == filters.transmission)
        if filters.body_type:
            query = query.where(Car.body_type == filters.body_type)
        if filters.min_price is not None:
            query = query.where(Car.price >= filters.min_price)
        if filters.max_price is not None:
            query = query.where(Car.price <= filters.max_price)
        if filters.min_year is not None:
            query = query.where(Car.year >= filters.min_year)
        if filters.max_year is not None:
            query = query.where(Car.year <= filters.max_year)
        if filters.max_km is not None:
            query = query.where(Car.kilometers_driven <= filters.max_km)
        if filters.min_score is not None:
            query = query.where(Car.inspection_score >= filters.min_score)

        # Always filter published cars unless explicitly querying admin
        query = query.where(Car.status == CarStatus.PUBLISHED)

        # Sorting
        if filters.sort_by == "price_asc":
            query = query.order_by(asc(Car.price))
        elif filters.sort_by == "price_desc":
            query = query.order_by(desc(Car.price))
        elif filters.sort_by == "km_asc":
            query = query.order_by(asc(Car.kilometers_driven))
        elif filters.sort_by == "year_desc":
            query = query.order_by(desc(Car.year))
        elif filters.sort_by == "score_desc":
            query = query.order_by(desc(Car.inspection_score))
        else:
            query = query.order_by(desc(Car.created_at))

        # Total count query
        count_query = select(func.count(Car.id)).where(Car.status == CarStatus.PUBLISHED)
        if filters.make:
            count_query = count_query.where(Car.make.ilike(f"%{filters.make.strip()}%"))
        if filters.city:
            count_query = count_query.where(Car.city.ilike(f"%{filters.city.strip()}%"))

        count_result = await db.execute(count_query)
        total_count = count_result.scalar_one()

        # Pagination
        offset = (filters.page - 1) * filters.page_size
        query = query.offset(offset).limit(filters.page_size)

        result = await db.execute(query)
        cars = list(result.scalars().all())
        total_pages = math.ceil(total_count / filters.page_size) if total_count > 0 else 1

        return cars, total_count, total_pages

    @staticmethod
    async def create_car(db: AsyncSession, car_in: CarCreate) -> Car:
        """Create a new car with images and features."""
        car_data = car_in.model_dump(exclude={"images", "features"})
        db_car = Car(**car_data)
        db.add(db_car)
        await db.flush()

        if car_in.images:
            for img in car_in.images:
                db_img = CarImage(car_id=db_car.id, **img.model_dump())
                db.add(db_img)

        if car_in.features:
            for feat in car_in.features:
                db_feat = CarFeature(car_id=db_car.id, **feat.model_dump())
                db.add(db_feat)

        await db.commit()
        await db.refresh(db_car)
        return await CarService.get_car_by_id(db, db_car.id)
