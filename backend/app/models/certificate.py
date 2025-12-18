from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    category = Column(String, nullable=True)  # категория сертификата (номинал, на массаж и т.д.)
    description = Column(JSON, nullable=True)  # JSON: included_services, expires_at_text, usage_type, usage_location
    image_url = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # владелец сертификата
    purchased_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # кто купил
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    purchased_by = relationship("User", foreign_keys=[purchased_by_user_id])

