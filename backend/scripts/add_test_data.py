import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Service, Master
from app.models.master import master_service_association
from decimal import Decimal

def add_test_data():
    db = SessionLocal()
    try:
        existing_services = db.query(Service).count()
        if existing_services == 0:
            test_services = [
                Service(
                    name="Маникюр",
                    category="Маникюр",
                    description="Классический маникюр с покрытием гель-лак",
                    price=Decimal("1500.00"),
                    duration_minutes=90,
                    is_active=True
                ),
                Service(
                    name="Брови",
                    category="Брови",
                    description="Коррекция и окрашивание бровей",
                    price=Decimal("1200.00"),
                    duration_minutes=60,
                    is_active=True
                ),
                Service(
                    name="Педикюр",
                    category="Педикюр",
                    description="Классический педикюр с покрытием гель-лак",
                    price=Decimal("1800.00"),
                    duration_minutes=90,
                    is_active=True
                ),
                Service(
                    name="Мейк",
                    category="Макияж",
                    description="Дневной макияж",
                    price=Decimal("2500.00"),
                    duration_minutes=60,
                    is_active=True
                ),
                Service(
                    name="Шугаринг",
                    category="Депиляция",
                    description="Шугаринг ног",
                    price=Decimal("800.00"),
                    duration_minutes=30,
                    is_active=True
                ),
                Service(
                    name="Массаж",
                    category="Массаж",
                    description="Расслабляющий массаж тела",
                    price=Decimal("2000.00"),
                    duration_minutes=60,
                    is_active=True
                ),
                Service(
                    name="Укладка",
                    category="Прическа",
                    description="Укладка волос",
                    price=Decimal("1500.00"),
                    duration_minutes=45,
                    is_active=True
                )
            ]
            
            for service in test_services:
                db.add(service)
            db.commit()
            print(f"Успешно добавлено {len(test_services)} тестовых услуг")
        else:
            print(f"В базе уже есть {existing_services} услуг. Пропускаем добавление.")
        
        existing_masters = db.query(Master).count()
        if existing_masters == 0:
            services = db.query(Service).all()
            service_map = {s.name: s.id for s in services}
            
            test_masters = [
                {
                    "name": "Анна М.",
                    "specialization": "Мастер маникюра и педикюра",
                    "services": ["Маникюр", "Педикюр"],
                    "work_schedule": {
                        "monday": {"start": "09:00", "end": "18:00"},
                        "tuesday": {"start": "09:00", "end": "18:00"},
                        "wednesday": {"start": "09:00", "end": "18:00"},
                        "thursday": {"start": "09:00", "end": "18:00"},
                        "friday": {"start": "09:00", "end": "18:00"},
                        "saturday": {"start": "10:00", "end": "16:00"}
                    }
                },
                {
                    "name": "Диана М.",
                    "specialization": "Массажист",
                    "services": ["Массаж"],
                    "work_schedule": {
                        "monday": {"start": "10:00", "end": "19:00"},
                        "tuesday": {"start": "10:00", "end": "19:00"},
                        "wednesday": {"start": "10:00", "end": "19:00"},
                        "thursday": {"start": "10:00", "end": "19:00"},
                        "friday": {"start": "10:00", "end": "19:00"},
                        "saturday": {"start": "11:00", "end": "17:00"}
                    }
                },
                {
                    "name": "Елена К.",
                    "specialization": "Визажист и бровист",
                    "services": ["Мейк", "Брови"],
                    "work_schedule": {
                        "monday": {"start": "09:00", "end": "18:00"},
                        "tuesday": {"start": "09:00", "end": "18:00"},
                        "wednesday": {"start": "09:00", "end": "18:00"},
                        "thursday": {"start": "09:00", "end": "18:00"},
                        "friday": {"start": "09:00", "end": "18:00"},
                        "saturday": {"start": "10:00", "end": "16:00"}
                    }
                },
                {
                    "name": "Мария С.",
                    "specialization": "Парикмахер",
                    "services": ["Укладка"],
                    "work_schedule": {
                        "monday": {"start": "09:00", "end": "18:00"},
                        "tuesday": {"start": "09:00", "end": "18:00"},
                        "wednesday": {"start": "09:00", "end": "18:00"},
                        "thursday": {"start": "09:00", "end": "18:00"},
                        "friday": {"start": "09:00", "end": "18:00"},
                        "saturday": {"start": "10:00", "end": "16:00"}
                    }
                },
                {
                    "name": "Ольга В.",
                    "specialization": "Мастер депиляции",
                    "services": ["Шугаринг"],
                    "work_schedule": {
                        "monday": {"start": "10:00", "end": "19:00"},
                        "tuesday": {"start": "10:00", "end": "19:00"},
                        "wednesday": {"start": "10:00", "end": "19:00"},
                        "thursday": {"start": "10:00", "end": "19:00"},
                        "friday": {"start": "10:00", "end": "19:00"},
                        "saturday": {"start": "11:00", "end": "17:00"}
                    }
                }
            ]
            
            for master_data in test_masters:
                master = Master(
                    name=master_data["name"],
                    specialization=master_data["specialization"],
                    work_schedule=master_data["work_schedule"],
                    is_active=True
                )
                db.add(master)
                db.flush()
                
                for service_name in master_data["services"]:
                    if service_name in service_map:
                        db.execute(
                            master_service_association.insert().values(
                                master_id=master.id,
                                service_id=service_map[service_name]
                            )
                        )
            
            db.commit()
            print(f"Успешно добавлено {len(test_masters)} тестовых мастеров")
        else:
            print(f"В базе уже есть {existing_masters} мастеров. Пропускаем добавление.")
    except Exception as e:
        db.rollback()
        print(f"Ошибка при добавлении тестовых данных: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_test_data()
