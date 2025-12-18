from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class SalonSettings(Base):
    __tablename__ = "salon_settings"

    id = Column(Integer, primary_key=True, index=True)
    working_hours = Column(JSON, nullable=True)  # JSON: общее расписание салона
    address = Column(String, nullable=True)  # "Волгоград, ул. Мира, 6"
    phone = Column(String, nullable=True)  # основной телефон
    email = Column(String, nullable=True)
    social_links = Column(JSON, nullable=True)  # JSON: {vk, instagram, telegram}
    map_coordinates = Column(String, nullable=True)  # "48.706836, 44.511980"
    privacy_policy_text = Column(Text, nullable=True)  # статический текст политики конфиденциальности
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

