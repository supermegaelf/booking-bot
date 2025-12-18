from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, Table, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


master_service_association = Table(
    "master_services",
    Base.metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("master_id", Integer, ForeignKey("masters.id"), nullable=False),
    Column("service_id", Integer, ForeignKey("services.id"), nullable=False),
)


class Master(Base):
    __tablename__ = "masters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    telegram_id = Column(Integer, nullable=True)
    photo_url = Column(String, nullable=True)
    work_schedule = Column(JSON, nullable=True)  # JSON для индивидуального расписания мастера
    rating = Column(Numeric(3, 2), nullable=True, default=0)
    reviews_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    services = relationship("Service", secondary=master_service_association, back_populates="masters")
    reviews = relationship("Review", back_populates="master")
