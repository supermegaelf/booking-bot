from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas import CertificateResponse
from app.models import Certificate, User

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


def get_current_user(telegram_id: Optional[int] = Header(None, alias="X-Telegram-User-Id"), db: Session = Depends(get_db)) -> User:
    if not telegram_id:
        raise HTTPException(status_code=401, detail="Telegram user ID required")
    
    user = db.query(User).filter(User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.get("/", response_model=List[CertificateResponse])
async def get_certificates(
    current_user: User = Depends(get_current_user),
    is_used: bool = None,
    db: Session = Depends(get_db)
):
    query = db.query(Certificate).filter(Certificate.user_id == current_user.id)
    
    if is_used is not None:
        query = query.filter(Certificate.is_used == is_used)
    
    certificates = query.order_by(Certificate.created_at.desc()).all()
    return certificates


@router.get("/{certificate_id}", response_model=CertificateResponse)
async def get_certificate(
    certificate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    certificate = db.query(Certificate).filter(
        Certificate.id == certificate_id,
        Certificate.user_id == current_user.id
    ).first()
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    return certificate
