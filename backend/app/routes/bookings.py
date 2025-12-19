from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.schemas import BookingResponse, BookingCreate, BookingReschedule
from app.models import Booking, User, Service, Master
from app.models.booking import BookingStatus

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


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
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user for telegram_id: {telegram_id}")
    
    return user


@router.post("/", response_model=BookingResponse)
async def create_booking(
    booking: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == booking.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if booking.master_id:
        master = db.query(Master).filter(Master.id == booking.master_id).first()
        if not master:
            raise HTTPException(status_code=404, detail="Master not found")
    
    if booking.certificate_id:
        from app.models import Certificate
        certificate = db.query(Certificate).filter(
            Certificate.id == booking.certificate_id,
            Certificate.user_id == current_user.id,
            Certificate.is_used == False
        ).first()
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found or already used")
    
    existing_booking = db.query(Booking).filter(
        Booking.master_id == booking.master_id,
        Booking.booking_date == booking.booking_date,
        Booking.booking_time == booking.booking_time,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
    ).first()
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    db_booking = Booking(
        user_id=current_user.id,
        service_id=booking.service_id,
        master_id=booking.master_id,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        comment=booking.comment,
        certificate_id=booking.certificate_id,
        status=BookingStatus.PENDING
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    return db_booking


@router.get("/", response_model=List[BookingResponse])
async def get_bookings(
    current_user: User = Depends(get_current_user),
    status: Optional[BookingStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Booking).filter(Booking.user_id == current_user.id)
    
    if status:
        query = query.filter(Booking.status == status)
    
    bookings = query.order_by(Booking.booking_date.desc(), Booking.booking_time.desc()).all()
    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return booking


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot cancel completed or already cancelled booking")
    
    booking_datetime = datetime.combine(booking.booking_date, datetime.strptime(booking.booking_time, "%H:%M").time())
    time_until_booking = (booking_datetime - datetime.now()).total_seconds() / 3600
    
    if time_until_booking < 24:
        raise HTTPException(status_code=400, detail="Cannot cancel booking less than 24 hours before appointment")
    
    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    
    return booking


@router.patch("/{booking_id}/reschedule", response_model=BookingResponse)
async def reschedule_booking(
    booking_id: int,
    reschedule_data: BookingReschedule,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.user_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail="Cannot reschedule completed or cancelled booking")
    
    existing_booking = db.query(Booking).filter(
        Booking.master_id == booking.master_id,
        Booking.booking_date == reschedule_data.booking_date,
        Booking.booking_time == reschedule_data.booking_time,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.id != booking_id
    ).first()
    
    if existing_booking:
        raise HTTPException(status_code=400, detail="Time slot already booked")
    
    booking.booking_date = reschedule_data.booking_date
    booking.booking_time = reschedule_data.booking_time
    booking.status = BookingStatus.PENDING
    
    db.commit()
    db.refresh(booking)
    
    return booking
