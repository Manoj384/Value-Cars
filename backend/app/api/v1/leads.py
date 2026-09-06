import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.lead import Lead, LeadStatus
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate, SellCarValuationRequest, SellCarValuationResponse
from app.services.valuation_engine import ValuationEngine

router = APIRouter()


@router.post("/valuation", response_model=SellCarValuationResponse, summary="Instant Car Valuation Estimator")
async def estimate_valuation(request: SellCarValuationRequest):
    """Estimate used car selling price & fair market value."""
    result = ValuationEngine.calculate_valuation(
        make=request.make,
        model=request.model,
        year=request.year,
        kilometers_driven=request.kilometers_driven,
        fuel_type=request.fuel_type,
        transmission=request.transmission,
        ownership=request.ownership,
    )
    return SellCarValuationResponse(
        estimated_min_price=result["estimated_min_price"],
        estimated_max_price=result["estimated_max_price"],
        recommended_procurement_price=result["recommended_procurement_price"],
    )


@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED, summary="Submit Lead / Sell Car Form")
async def create_lead(lead_in: LeadCreate, db: AsyncSession = Depends(get_db)):
    """Customer submits a Sell Car enquiry or Buy enquiry."""
    # Compute estimate if sell car lead
    if lead_in.lead_type.value == "SELL_CAR" and lead_in.car_details:
        lead_in.estimated_valuation = lead_in.expected_price

    lead = Lead(**lead_in.model_dump())
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.get("", response_model=List[LeadResponse], summary="Admin CRM: Get All Leads")
async def list_leads(
    status: Optional[LeadStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Admin CRM pipeline to track and convert leads."""
    query = select(Lead).order_by(desc(Lead.created_at)).limit(limit)
    if status:
        query = query.where(Lead.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.patch("/{lead_id}", response_model=LeadResponse, summary="Admin CRM: Update Lead Status")
async def update_lead(
    lead_id: uuid.UUID,
    lead_update: LeadUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update lead stage (e.g., CONTACTED -> TEST_DRIVE -> WON/LOST)."""
    query = select(Lead).where(Lead.id == lead_id)
    result = await db.execute(query)
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")

    for field, value in lead_update.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)
    return lead
