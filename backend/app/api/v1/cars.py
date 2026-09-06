import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.car import BodyType, FuelType, TransmissionType
from app.schemas.car import CarCreate, CarFilterParams, CarListResponse, CarResponse
from app.services.car_service import CarService
from app.services.valuation_engine import ValuationEngine

router = APIRouter()


@router.get("", response_model=CarListResponse, summary="Browse and Search Cars")
async def get_cars(
    make: Optional[str] = None,
    model: Optional[str] = None,
    city: Optional[str] = None,
    fuel_type: Optional[FuelType] = None,
    transmission: Optional[TransmissionType] = None,
    body_type: Optional[BodyType] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_year: Optional[int] = None,
    max_year: Optional[int] = None,
    max_km: Optional[int] = None,
    min_score: Optional[float] = None,
    sort_by: Optional[str] = Query("created_at", description="price_asc | price_desc | km_asc | year_desc | score_desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve catalog of published cars with dynamic filters, pagination, and sorting."""
    filters = CarFilterParams(
        make=make,
        model=model,
        city=city,
        fuel_type=fuel_type,
        transmission=transmission,
        body_type=body_type,
        min_price=min_price,
        max_price=max_price,
        min_year=min_year,
        max_year=max_year,
        max_km=max_km,
        min_score=min_score,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )

    cars, total, pages = await CarService.list_cars(db, filters)
    return CarListResponse(
        items=[CarResponse.model_validate(c) for c in cars],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/{car_id}", response_model=CarResponse, summary="Get Car Details")
async def get_car_details(car_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch single vehicle with complete image gallery and features list."""
    car = await CarService.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{car_id}' not found",
        )
    return CarResponse.model_validate(car)


@router.post("", response_model=CarResponse, status_code=status.HTTP_201_CREATED, summary="Add Car to Inventory")
async def create_car(car_in: CarCreate, db: AsyncSession = Depends(get_db)):
    """Add a new vehicle to inventory (Admin/Operations)."""
    # Automatically compute algorithmic valuation if not provided
    if not car_in.estimated_market_min or not car_in.estimated_market_max:
        val = ValuationEngine.calculate_valuation(
            make=car_in.make,
            model=car_in.model,
            year=car_in.year,
            kilometers_driven=car_in.kilometers_driven,
            fuel_type=car_in.fuel_type.value,
            transmission=car_in.transmission.value,
            ownership=car_in.ownership.value,
            inspection_score=car_in.inspection_score,
        )
        car_in.estimated_market_min = val["estimated_min_price"]
        car_in.estimated_market_max = val["estimated_max_price"]

    car = await CarService.create_car(db, car_in)
    return CarResponse.model_validate(car)
