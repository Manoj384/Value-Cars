import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.car import Car
from app.models.inspection import Inspection, InspectionItem, InspectionStatus
from app.schemas.inspection import InspectionCreate, InspectionResponse, InspectionUpdate

router = APIRouter()


@router.put("/car/{car_id}", response_model=InspectionResponse, summary="Admin: Update Car Inspection Scores")
async def update_car_inspection(
    car_id: uuid.UUID,
    insp_in: InspectionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Admin updates quality assurance scores and inspector remarks for a car."""
    car_res = await db.execute(select(Car).where(Car.id == car_id))
    car = car_res.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    query = (
        select(Inspection)
        .where(Inspection.car_id == car_id)
        .order_by(desc(Inspection.created_at))
    )
    result = await db.execute(query)
    insp = result.scalars().first()

    if not insp:
        insp = Inspection(
            car_id=car_id,
            overall_score=insp_in.overall_score or 8.8,
            status=InspectionStatus.APPROVED,
            summary_notes="Digital quality assurance rating updated by Admin.",
        )
        db.add(insp)
        await db.flush()

    if insp_in.overall_score is not None:
        insp.overall_score = insp_in.overall_score
        car.inspection_score = insp_in.overall_score
    if insp_in.engine_score is not None:
        insp.engine_score = insp_in.engine_score
    if insp_in.exterior_score is not None:
        insp.exterior_score = insp_in.exterior_score
    if insp_in.interior_score is not None:
        insp.interior_score = insp_in.interior_score
    if insp_in.transmission_score is not None:
        insp.transmission_score = insp_in.transmission_score
    if insp_in.suspension_score is not None:
        insp.suspension_score = insp_in.suspension_score
    if insp_in.ac_score is not None:
        insp.ac_score = insp_in.ac_score
    if insp_in.summary_notes is not None:
        insp.summary_notes = insp_in.summary_notes

    await db.commit()

    query_full = (
        select(Inspection)
        .where(Inspection.id == insp.id)
        .options(selectinload(Inspection.items))
    )
    res = await db.execute(query_full)
    return InspectionResponse.model_validate(res.scalar_one())


@router.get("/car/{car_id}", response_model=Optional[InspectionResponse], summary="Get Car Inspection Report")
async def get_car_inspection(car_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Fetch digital inspection checklist, photos, and scoring report for a car."""
    query = (
        select(Inspection)
        .where(Inspection.car_id == car_id)
        .order_by(desc(Inspection.created_at))
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
