from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import schemas
from app.models import Review, User, Master, Booking

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def get_current_user(telegram_id: Optional[int] = Header(None, alias="X-Telegram-User-Id"), db: Session = Depends(get_db)) -> User:
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Telegram user ID required")
    
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.post("/", response_model=schemas.ReviewResponse)
async def create_review(
    review: schemas.ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    master = db.query(Master).filter(Master.id == review.master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    if review.booking_id:
        booking = db.query(Booking).filter(
            Booking.id == review.booking_id,
            Booking.user_id == current_user.id,
            Booking.master_id == review.master_id
        ).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
    
    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.master_id == review.master_id,
        Review.booking_id == review.booking_id
    ).first()
    
    if existing_review:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")
    
    db_review = Review(
        user_id=current_user.id,
        master_id=review.master_id,
        booking_id=review.booking_id,
        rating=review.rating,
        comment=review.comment
    )
    
    db.add(db_review)
    
    reviews = db.query(Review).filter(Review.master_id == review.master_id).all()
    total_rating = sum(r.rating for r in reviews) + review.rating
    count = len(reviews) + 1
    master.rating = total_rating / count
    master.reviews_count = count
    
    db.commit()
    db.refresh(db_review)
    
    return db_review


@router.get("/master/{master_id}", response_model=List[schemas.ReviewResponse])
async def get_master_reviews(master_id: int, db: Session = Depends(get_db)):
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    reviews = db.query(Review).filter(Review.master_id == master_id).order_by(
        Review.created_at.desc()
    ).all()
    
    return reviews
