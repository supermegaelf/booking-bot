from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date, time
from decimal import Decimal
from app.models.booking import BookingStatus


class ServiceBase(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    price: Decimal
    duration_minutes: int
    image_url: Optional[str] = None
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceResponse(ServiceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MasterBase(BaseModel):
    name: str
    specialization: Optional[str] = None
    phone: Optional[str] = None
    telegram_id: Optional[int] = None
    photo_url: Optional[str] = None
    work_schedule: Optional[dict] = None
    is_active: bool = True


class MasterCreate(MasterBase):
    service_ids: Optional[List[int]] = []


class MasterResponse(MasterBase):
    id: int
    rating: Optional[Decimal] = None
    reviews_count: int = 0
    services: List[ServiceResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MasterWithServices(MasterResponse):
    available_services: List[ServiceResponse] = []


class BookingBase(BaseModel):
    service_id: int
    master_id: Optional[int] = None
    booking_date: date
    booking_time: str
    comment: Optional[str] = None
    certificate_id: Optional[int] = None


class BookingCreate(BookingBase):
    pass


class BookingResponse(BookingBase):
    id: int
    user_id: int
    status: BookingStatus
    service: ServiceResponse
    master: Optional[MasterResponse] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CertificateBase(BaseModel):
    code: str
    amount: Decimal
    category: Optional[str] = None
    description: Optional[dict] = None
    image_url: Optional[str] = None


class CertificateResponse(CertificateBase):
    id: int
    user_id: Optional[int] = None
    purchased_by_user_id: Optional[int] = None
    is_used: bool
    used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PromotionResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    discount_percent: Decimal
    image_url: Optional[str] = None
    start_date: datetime
    end_date: datetime
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewBase(BaseModel):
    master_id: int
    booking_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SalonSettingsResponse(BaseModel):
    id: int
    working_hours: Optional[dict] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    social_links: Optional[dict] = None
    map_coordinates: Optional[str] = None
    privacy_policy_text: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_admin: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class AvailableTimeSlot(BaseModel):
    time: str
    available: bool
    master_id: Optional[int] = None
    master_name: Optional[str] = None


class AvailableSlotsResponse(BaseModel):
    date: date
    slots: List[AvailableTimeSlot]
