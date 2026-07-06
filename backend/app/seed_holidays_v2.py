from app.database.connection import SessionLocal
from app.database.models import Holiday
from datetime import datetime, timedelta
import calendar as pycalendar

db = SessionLocal()

print("Seeding verified holidays, exams, and events for Sem 3 (July-Dec 2026)...")

# ---- Fixed festival/national holidays, verified against 2026 Indian govt gazette ----
fixed_holidays = [
    ("2026-08-15", "Independence Day"),
    ("2026-09-14", "Ganesh Chaturthi"),   
    ("2026-10-02", "Gandhi Jayanti"),
    ("2026-10-20", "Dussehra"),
    ("2026-11-08", "Diwali"),
    ("2026-11-09", "Diwali Holiday"),
    ("2026-12-25", "Christmas"),
]

# ---- Classes commence ----
# "Third week Monday of July" = the Monday that falls in the 3rd week of July 2026
def third_week_monday(year, month):
    c = pycalendar.Calendar()
    mondays = [d for d in c.itermonthdates(year, month) if d.month == month and d.weekday() == 0]
    return mondays[2]  # 3rd Monday

classes_commence = third_week_monday(2026, 7)
internal1_start = third_week_monday(2026, 8)
internal2_start = third_week_monday(2026, 9)
external_start = third_week_monday(2026, 11)

events = [
    (classes_commence.strftime("%Y-%m-%d"), "Classes Commence for I, III, V, VI Sem"),
]

# ---- Tech fest: mid-October, 3-4 days ----
tech_fest_start = datetime(2026, 10, 14)
tech_fest_days = [(tech_fest_start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(4)]
for i, d in enumerate(tech_fest_days):
    events.append((d, f"TechTatva {i+1}/4"))

db_existing = {h.date.strftime("%Y-%m-%d") for h in db.query(Holiday).all()}

created = 0


def add_holiday(date_str, label, htype):
    global created
    if date_str in db_existing:
        return
    db.add(Holiday(date=datetime.strptime(date_str, "%Y-%m-%d"), label=label, type=htype))
    db_existing.add(date_str)
    created += 1


def is_holiday_date(date_str):
    return date_str in db_existing


# Fixed festival holidays
for date_str, label in fixed_holidays:
    add_holiday(date_str, label, "holiday")

# Every Sunday + 3rd Saturday of each month (Jul-Dec 2026) = holiday
start_date = datetime(2026, 7, 1)
end_date = datetime(2026, 12, 31)
current = start_date
month_saturdays = {}
while current <= end_date:
    if current.weekday() == 6:  # Sunday
        add_holiday(current.strftime("%Y-%m-%d"), "Sunday", "holiday")
    if current.weekday() == 5:  # Saturday
        key = (current.year, current.month)
        month_saturdays.setdefault(key, []).append(current)
    current += timedelta(days=1)

for (y, m), sats in month_saturdays.items():
    if len(sats) >= 3:
        third_sat = sats[2]
        add_holiday(third_sat.strftime("%Y-%m-%d"), "Third Saturday", "holiday")

# Events (classes commence, tech fest)
for date_str, label in events:
    add_holiday(date_str, label, "event")

# ---- Exams: 5 subjects, one exam per day, skip holidays, in sequence ----
SUBJECTS_IN_ORDER = ["Data Structures", "DBMS", "Operating Systems", "Computer Networks", "Web Technologies"]


def schedule_exam_sequence(start_dt, exam_label):
    d = start_dt
    scheduled = 0
    while scheduled < len(SUBJECTS_IN_ORDER):
        date_str = d.strftime("%Y-%m-%d")
        if not is_holiday_date(date_str):
            subject = SUBJECTS_IN_ORDER[scheduled]
            add_holiday(date_str, f"{exam_label}: {subject}", "exam")
            scheduled += 1
        d += timedelta(days=1)


schedule_exam_sequence(internal1_start, "Internal 1")
schedule_exam_sequence(internal2_start, "Internal 2")
schedule_exam_sequence(external_start, "External")

db.commit()
print(f"Created {created} new calendar entries.")
print(f"Classes commence: {classes_commence.strftime('%d %b %Y')}")
print(f"Internal 1 starts: {internal1_start.strftime('%d %b %Y')}")
print(f"Internal 2 starts: {internal2_start.strftime('%d %b %Y')}")
print(f"External starts: {external_start.strftime('%d %b %Y')}")
db.close()