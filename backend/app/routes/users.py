from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
from app.database import get_db
from app.schemas import UserResponse, UserUpdate
from app.models import User

router = APIRouter(prefix="/api/users", tags=["users"])


def get_current_user(telegram_id: Optional[int] = Header(None, alias="X-Telegram-User-Id"), db: Session = Depends(get_db)) -> User:
    import logging
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


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.email is not None:
        current_user.email = user_update.email
    if user_update.first_name is not None:
        current_user.first_name = user_update.first_name
    if user_update.last_name is not None:
        current_user.last_name = user_update.last_name
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
