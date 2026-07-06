from app.database.connection import SessionLocal
from app.database.models import Holiday
from datetime import datetime

db = SessionLocal()

print("Seeding holidays for Sem 3 (July-Dec 2026)...")

holidays_data = [
    ("2026-08-15", "Independence Day", "holiday"),
    ("2026-08-26", "Ganesh Chaturthi", "holiday"),
    ("2026-10-02", "Gandhi Jayanti", "holiday"),
    ("2026-10-20", "Dussehra", "holiday"),
    ("2026-11-08", "Diwali", "holiday"),
    ("2026-11-09", "Diwali Break", "holiday"),
    ("2026-12-25", "Christmas", "holiday"),
    ("2026-09-15", "Internal 1 Exams Begin", "exam"),
    ("2026-11-15", "Internal 2 Exams Begin", "exam"),
    ("2026-12-10", "External Exams Begin", "exam"),
    ("2026-07-15", "Semester 3 Orientation", "event"),
]

existing_dates = {h.date.strftime("%Y-%m-%d") for h in db.query(Holiday).all()}

created = 0
for date_str, label, htype in holidays_data:
    if date_str in existing_dates:
        continue
    db.add(Holiday(date=datetime.strptime(date_str, "%Y-%m-%d"), label=label, type=htype))
    created += 1

db.commit()
print(f"Created {created} new holiday/event entries.")
db.close()