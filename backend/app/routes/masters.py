from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta
from app.database import get_db
from app.schemas import MasterResponse, AvailableTimeSlot, AvailableSlotsResponse
from app.models import Master, Service, Booking, master_service_association
from app.models.booking import BookingStatus
from sqlalchemy import and_, or_

router = APIRouter(prefix="/api/masters", tags=["masters"])


@router.get("/", response_model=List[MasterResponse])
async def get_masters(
    service_id: Optional[int] = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Master)
    
    if is_active:
        query = query.filter(Master.is_active == True)
    
    if service_id:
        query = query.join(master_service_association).filter(
            master_service_association.c.service_id == service_id
        )
    
    masters = query.all()
    return masters


@router.get("/{master_id}", response_model=MasterResponse)
async def get_master(master_id: int, db: Session = Depends(get_db)):
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    return master


@router.get("/{master_id}/available-slots", response_model=AvailableSlotsResponse)
async def get_available_slots(
    master_id: int,
    booking_date: date,
    service_id: int,
    db: Session = Depends(get_db)
):
    master = db.query(Master).filter(Master.id == master_id).first()
    if not master:
        raise HTTPException(status_code=404, detail="Master not found")
    
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    existing_bookings = db.query(Booking).filter(
        and_(
            Booking.master_id == master_id,
            Booking.booking_date == booking_date,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
        )
    ).all()
    
    booked_times = {booking.booking_time for booking in existing_bookings}
    
    work_schedule = master.work_schedule or {}
    day_name = booking_date.strftime("%A").lower()
    day_schedule = work_schedule.get(day_name, {})
    
    start_time = day_schedule.get("start", "09:00")
    end_time = day_schedule.get("end", "18:00")
    
    slots = []
    start = datetime.strptime(start_time, "%H:%M").time()
    end = datetime.strptime(end_time, "%H:%M").time()
    duration = timedelta(minutes=service.duration_minutes)
    
    current = datetime.combine(booking_date, start)
    end_datetime = datetime.combine(booking_date, end)
    
    while current + duration <= end_datetime:
        time_str = current.time().strftime("%H:%M")
        is_available = time_str not in booked_times
        
        slots.append(AvailableTimeSlot(
            time=time_str,
            available=is_available,
            master_id=master_id,
            master_name=master.name
        ))
        
        current += timedelta(minutes=30)
    
    return AvailableSlotsResponse(date=booking_date, slots=slots)


@router.get("/service/{service_id}/available-slots", response_model=AvailableSlotsResponse)
async def get_available_slots_for_service(
    service_id: int,
    booking_date: date,
    master_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if master_id:
        masters = [db.query(Master).filter(Master.id == master_id).first()]
    else:
        masters = db.query(Master).join(master_service_association).filter(
            master_service_association.c.service_id == service_id,
            Master.is_active == True
        ).all()
    
    if not masters:
        return AvailableSlotsResponse(date=booking_date, slots=[])
    
    existing_bookings = db.query(Booking).filter(
        and_(
            Booking.booking_date == booking_date,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
        )
    ).all()
    
    booked_slots = {}
    for booking in existing_bookings:
        if booking.master_id:
            if booking.master_id not in booked_slots:
                booked_slots[booking.master_id] = set()
            booked_slots[booking.master_id].add(booking.booking_time)
    
    all_slots = []
    
    for master in masters:
        work_schedule = master.work_schedule or {}
        day_name = booking_date.strftime("%A").lower()
        day_schedule = work_schedule.get(day_name, {})
        
        start_time = day_schedule.get("start", "09:00")
        end_time = day_schedule.get("end", "18:00")
        
        start = datetime.strptime(start_time, "%H:%M").time()
        end = datetime.strptime(end_time, "%H:%M").time()
        duration = timedelta(minutes=service.duration_minutes)
        
        current = datetime.combine(booking_date, start)
        end_datetime = datetime.combine(booking_date, end)
        
        master_booked = booked_slots.get(master.id, set())
        
        while current + duration <= end_datetime:
            time_str = current.time().strftime("%H:%M")
            is_available = time_str not in master_booked
            
            all_slots.append(AvailableTimeSlot(
                time=time_str,
                available=is_available,
                master_id=master.id,
                master_name=master.name
            ))
            
            current += timedelta(minutes=30)
    
    all_slots.sort(key=lambda x: x.time)
    
    return AvailableSlotsResponse(date=booking_date, slots=all_slots)
