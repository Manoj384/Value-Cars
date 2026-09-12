import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User, Favorite
from app.models.car import Car, CarImage
from app.schemas.car import CarResponse

router = APIRouter()


@router.post("/{car_id}", summary="Toggle / Save Car to Favorites")
async def toggle_favorite(
    car_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Save or remove a car from customer favorites."""
    # Check if car exists
    car_res = await db.execute(select(Car).where(Car.id == car_id))
    car = car_res.scalar_one_or_none()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    # Check if already favorited
    fav_res = await db.execute(
        select(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.car_id == car_id,
        )
    )
    existing_fav = fav_res.scalar_one_or_none()

    if existing_fav:
        await db.delete(existing_fav)
        await db.commit()
        return {"is_favorited": False, "message": "Car removed from saved cars"}
    else:
        new_fav = Favorite(user_id=current_user.id, car_id=car_id)
        db.add(new_fav)
        await db.commit()
        return {"is_favorited": True, "message": "Car saved to your favorites"}


@router.get("", summary="List Current User Favorite Cars")
async def list_favorites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Retrieve all vehicles saved by the authenticated customer."""
    query = (
        select(Favorite)
        .where(Favorite.user_id == current_user.id)
        .options(selectinload(Favorite.car).selectinload(Car.images))
    )
    res = await db.execute(query)
    favorites = res.scalars().all()

    output = []
    for fav in favorites:
        if fav.car:
            car_data = CarResponse.model_validate(fav.car).model_dump()
            car_data["favorited_at"] = fav.created_at.isoformat()
            output.append(car_data)
    return output


@router.delete("/{car_id}", summary="Remove Car from Favorites")
async def remove_favorite(
    car_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove car from customer favorites."""
    await db.execute(
        delete(Favorite).where(
            Favorite.user_id == current_user.id,
            Favorite.car_id == car_id,
        )
    )
    await db.commit()
    return {"success": True, "message": "Removed from favorites"}
