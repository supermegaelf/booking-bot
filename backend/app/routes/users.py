from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import schemas
from app.models import User

router = APIRouter(prefix="/api/users", tags=["users"])


def get_current_user(telegram_id: Optional[int] = Header(None, alias="X-Telegram-User-Id"), db: Session = Depends(get_db)) -> User:
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Telegram user ID required")
    
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.get("/me", response_model=schemas.UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.patch("/me", response_model=schemas.UserResponse)
async def update_current_user_profile(
    user_update: schemas.UserUpdate,
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
