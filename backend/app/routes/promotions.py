from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app import schemas
from app.models import Promotion

router = APIRouter(prefix="/api/promotions", tags=["promotions"])


@router.get("/", response_model=List[schemas.PromotionResponse])
async def get_promotions(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Promotion)
    
    if active_only:
        now = datetime.utcnow()
        query = query.filter(
            Promotion.is_active == True,
            Promotion.start_date <= now,
            Promotion.end_date >= now
        )
    
    promotions = query.order_by(Promotion.start_date.desc()).all()
    return promotions


@router.get("/{promotion_id}", response_model=schemas.PromotionResponse)
async def get_promotion(promotion_id: int, db: Session = Depends(get_db)):
    promotion = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promotion:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return promotion
