from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base
import json


class SalonSettings(Base):
    __tablename__ = "salon_settings"

    id = Column(Integer, primary_key=True, index=True)
    working_hours = Column(Text, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    social_links = Column(Text, nullable=True)
    map_coordinates = Column(String, nullable=True)
    privacy_policy_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def get_working_hours(self):
        if self.working_hours:
            return json.loads(self.working_hours)
        return None

    def set_working_hours(self, hours):
        if hours:
            self.working_hours = json.dumps(hours)
        else:
            self.working_hours = None

    def get_social_links(self):
        if self.social_links:
            return json.loads(self.social_links)
        return None

    def set_social_links(self, links):
        if links:
            self.social_links = json.dumps(links)
        else:
            self.social_links = None

