from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import logging
from app.database import get_db
from app.schemas import ReviewResponse, ReviewCreate
from app.models import Review, User, Master, Booking

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


def get_current_user(telegram_id: Optional[int] = Header(None, alias="X-Telegram-User-Id"), db: Session = Depends(get_db)) -> User:
    logger = logging.getLogger(__name__)
    
    if not telegram_id:
        logger.warning("No telegram_id provided in header")
        raise HTTPException(status_code=401, detail="Telegram user ID required")
    
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        logger.warning(f"User not found for telegram_id: {telegram_id}")
        user = User(
            telegram_id=telegram_id,
            is_admin=False
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user for telegram_id: {telegram_id}")
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.telegram_id == telegram_id).first()
            logger.info(f"User already exists for telegram_id: {telegram_id}, retrieved from database")
    
    return user


@router.post("/", response_model=ReviewResponse)
async def create_review(
    review: ReviewCreate,
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


@router.get("/master/{master_id}", response_model=List[ReviewResponse])
async def get_master_reviews(master_id: int, db: Session = Depends(get_db)):
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    reviews = db.query(Review).filter(Review.master_id == master_id).order_by(
        Review.created_at.desc()
    ).all()
    
    return reviews
