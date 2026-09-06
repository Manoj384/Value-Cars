import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.car import Car
from app.models.inspection import Inspection, InspectionItem, InspectionStatus
from app.schemas.inspection import InspectionCreate, InspectionResponse

router = APIRouter()


@router.get("/car/{car_id}", response_model=Optional[InspectionResponse], summary="Get Car Inspection Report")
async def get_car_inspection(car_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch digital inspection checklist, photos, and scoring report for a car."""
    query = (
        select(Inspection)
        .where(Inspection.car_id == car_id)
        .options(selectinload(Inspection.items))
    )
    result = await db.execute(query)
    inspection = result.scalars().first()
    if not inspection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inspection report not found for this vehicle",
        )
    return InspectionResponse.model_validate(inspection)


@router.post("", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED, summary="Submit Inspector Report")
async def create_inspection(insp_in: InspectionCreate, db: AsyncSession = Depends(get_db)):
    """Digital Inspector App submits multi-point checklist and overall score."""
    # Check if car exists
    car_res = await db.execute(select(Car).where(Car.id == insp_in.car_id))
    car = car_res.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    insp_data = insp_in.model_dump(exclude={"items"})
    db_insp = Inspection(**insp_data)
    db.add(db_insp)
    await db.flush()

    if insp_in.items:
        for item in insp_in.items:
            db.add(InspectionItem(inspection_id=db_insp.id, **item.model_dump()))

    # Update car's inspection score
    car.inspection_score = insp_in.overall_score
    await db.commit()

    # Reload inspection with items
    query = (
        select(Inspection)
        .where(Inspection.id == db_insp.id)
        .options(selectinload(Inspection.items))
    )
    res = await db.execute(query)
    return InspectionResponse.model_validate(res.scalar_one())
