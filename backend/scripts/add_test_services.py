import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Service
from decimal import Decimal

def add_test_services():
    db = SessionLocal()
    try:
        existing_services = db.query(Service).count()
        if existing_services > 0:
            print(f"В базе уже есть {existing_services} услуг. Пропускаем добавление тестовых данных.")
            return

        test_services = [
            {
                "name": "Маникюр",
                "category": "Маникюр",
                "description": "Классический маникюр с покрытием гель-лак",
                "price": Decimal("1500.00"),
                "duration_minutes": 90,
                "is_active": True
            },
            {
                "name": "Брови",
                "category": "Брови",
                "description": "Коррекция и окрашивание бровей",
                "price": Decimal("1200.00"),
                "duration_minutes": 60,
                "is_active": True
            },
            {
                "name": "Педикюр",
                "category": "Педикюр",
                "description": "Классический педикюр с покрытием гель-лак",
                "price": Decimal("1800.00"),
                "duration_minutes": 90,
                "is_active": True
            },
            {
                "name": "Мейк",
                "category": "Макияж",
                "description": "Дневной макияж",
                "price": Decimal("2500.00"),
                "duration_minutes": 60,
                "is_active": True
            },
            {
                "name": "Шугаринг",
                "category": "Депиляция",
                "description": "Шугаринг ног",
                "price": Decimal("800.00"),
                "duration_minutes": 30,
                "is_active": True
            },
            {
                "name": "Массаж",
                "category": "Массаж",
                "description": "Расслабляющий массаж тела",
                "price": Decimal("2000.00"),
                "duration_minutes": 60,
                "is_active": True
            },
            {
                "name": "Укладка",
                "category": "Прическа",
                "description": "Укладка волос",
                "price": Decimal("1500.00"),
                "duration_minutes": 45,
                "is_active": True
            }
        ]

        for service_data in test_services:
            service = Service(**service_data)
            db.add(service)

        db.commit()
        print(f"Успешно добавлено {len(test_services)} тестовых услуг")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при добавлении тестовых услуг: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_test_services()
