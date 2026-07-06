from app.database.connection import SessionLocal
from app.database.models import Holiday, Timetable, Subject
from datetime import datetime, timedelta
import calendar as pycalendar

db = SessionLocal()

print("=== Full Sem 3 calendar rebuild: holidays, exams, events, then dated classes ===\n")

# STEP 0: wipe what we're regenerating
db.query(Holiday).delete()
sem3_subjects = db.query(Subject).filter(Subject.semester == 3).all()
subject_ids = [s.id for s in sem3_subjects]
db.query(Timetable).filter(Timetable.subject_id.in_(subject_ids)).delete(synchronize_session=False)
db.commit()

SEM_START = datetime(2026, 7, 1)
SEM_END = datetime(2026, 12, 31)


def third_week_monday(year, month):
    c = pycalendar.Calendar()
    mondays = [d for d in c.itermonthdates(year, month) if d.month == month and d.weekday() == 0]
    return datetime(mondays[2].year, mondays[2].month, mondays[2].day)


classes_commence = third_week_monday(2026, 7)
internal1_start = third_week_monday(2026, 8)
internal2_start = third_week_monday(2026, 9)
external_start = third_week_monday(2026, 11)

# STEP 1: holiday/event ground truth
calendar_entries = {}


def add_entry(date_str_, label, htype):
    calendar_entries.setdefault(date_str_, []).append((label, htype))


def is_blocked(date_str_):
    return date_str_ in calendar_entries


def ds(dt):
    return dt.strftime("%Y-%m-%d")


fixed_holidays = [
    ("2026-08-15", "Independence Day"),
    ("2026-09-14", "Ganesh Chaturthi"),
    ("2026-10-02", "Gandhi Jayanti"),
    ("2026-10-20", "Dussehra"),
    ("2026-11-08", "Diwali"),
    ("2026-11-09", "Diwali Holiday"),
    ("2026-12-25", "Christmas"),
]
for d, label in fixed_holidays:
    add_entry(d, label, "holiday")

current = SEM_START
month_saturdays = {}
while current <= SEM_END:
    if current.weekday() == 6:
        add_entry(ds(current), "Sunday", "holiday")
    if current.weekday() == 5:
        key = (current.year, current.month)
        month_saturdays.setdefault(key, []).append(current)
    current += timedelta(days=1)

for (y, m), sats in month_saturdays.items():
    if len(sats) >= 3:
        add_entry(ds(sats[2]), "Third Saturday", "holiday")

add_entry(ds(classes_commence), "Classes Commence for I, III, V, VI Sem", "event")

tech_fest_start = datetime(2026, 10, 14)
tech_fest_dates = [tech_fest_start + timedelta(days=i) for i in range(4)]
event_afternoon_block_dates = set()
for i, d in enumerate(tech_fest_dates):
    add_entry(ds(d), f"TechTatva {i+1}/4", "event")
    event_afternoon_block_dates.add(ds(d))

# STEP 2: exam sequencing with mandatory 1-day gap between exams, never on a blocked date
SUBJECTS_IN_ORDER = [s.name for s in sem3_subjects][:5] or \
    ["Data Structures", "DBMS", "Operating Systems", "Computer Networks", "Web Technologies"]


def schedule_exam_sequence(start_dt, exam_label):
    d = start_dt
    scheduled = 0
    last_exam_date = None
    while scheduled < len(SUBJECTS_IN_ORDER):
        date_key = ds(d)
        gap_ok = last_exam_date is None or (d - last_exam_date).days >= 2
        if not is_blocked(date_key) and gap_ok:
            subject = SUBJECTS_IN_ORDER[scheduled]
            add_entry(date_key, f"{exam_label}: {subject}", "exam")
            last_exam_date = d
            scheduled += 1
        d += timedelta(days=1)
    return d


internal1_end = schedule_exam_sequence(internal1_start, "Internal 1")
internal2_end = schedule_exam_sequence(internal2_start, "Internal 2")
external_end = schedule_exam_sequence(external_start, "External")

add_entry(ds(external_end), "Semester Ends", "holiday")
SEM_TEACHING_END = external_end - timedelta(days=1)

for date_key, entries in calendar_entries.items():
    for label, htype in entries:
        db.add(Holiday(date=datetime.strptime(date_key, "%Y-%m-%d"), label=label, type=htype))
db.commit()
print(f"Seeded {sum(len(v) for v in calendar_entries.values())} calendar entries.")
print(f"Classes commence: {classes_commence.strftime('%d %b %Y')}")
print(f"Internal 1: {internal1_start.strftime('%d %b')} -> last day before {internal1_end.strftime('%d %b')}")
print(f"Internal 2: {internal2_start.strftime('%d %b')} -> last day before {internal2_end.strftime('%d %b')}")
print(f"External: {external_start.strftime('%d %b')} -> last day before {external_end.strftime('%d %b')}")
print(f"Semester ends marker: {external_end.strftime('%d %b %Y')}\n")

# STEP 3: generate REAL DATED class sessions only on valid teaching days
SLOTS_MORNING = [("09:00", "10:00"), ("10:30", "11:30")]
SLOTS_AFTERNOON = [("13:30", "14:30"), ("14:30", "15:30"), ("15:30", "16:30")]

ROOMS = ["Room 101", "Room 102", "Lab 1", "Room 201", "Room 202"]
room_map = dict(zip(SUBJECTS_IN_ORDER, ROOMS))

weekly_counts_target = {name: 3 for name in SUBJECTS_IN_ORDER}
if "Web Technologies" in weekly_counts_target:
    weekly_counts_target["Web Technologies"] = 4
else:
    weekly_counts_target[SUBJECTS_IN_ORDER[-1]] = 4

valid_teaching_days = []
d = classes_commence
while d <= SEM_TEACHING_END:
    date_key = ds(d)
    if d.weekday() != 6 and not is_blocked(date_key):  # not Sunday, not holiday/exam
        valid_teaching_days.append(d)
    d += timedelta(days=1)

weeks = {}
for day in valid_teaching_days:
    week_key = day.strftime("%Y-W%U")
    weeks.setdefault(week_key, []).append(day)

created = 0
for week_key, days_in_week in weeks.items():
    remaining = dict(weekly_counts_target)
    day_assignments = {ds(day): [] for day in days_in_week}

    attempts = 0
    while any(v > 0 for v in remaining.values()) and attempts < 200:
        attempts += 1
        candidate_days = [day for day in days_in_week if len(day_assignments[ds(day)]) < 4]
        if not candidate_days:
            break
        day = min(candidate_days, key=lambda dd: len(day_assignments[ds(dd)]))
        date_key = ds(day)
        is_event_day = date_key in event_afternoon_block_dates
        max_today = 2 if is_event_day else 4

        if len(day_assignments[date_key]) >= max_today:
            continue

        candidates = [s for s, c in remaining.items() if c > 0 and s not in day_assignments[date_key]]
        if not candidates:
            break
        subject = max(candidates, key=lambda s: remaining[s])
        day_assignments[date_key].append(subject)
        remaining[subject] -= 1

    for day in days_in_week:
        date_key = ds(day)
        is_event_day = date_key in event_afternoon_block_dates
        max_today = min(2 if is_event_day else 4, 4)
        pool = list(weekly_counts_target.keys())
        while len(day_assignments[date_key]) < min(2, max_today):
            added = False
            for s in pool:
                if s not in day_assignments[date_key]:
                    day_assignments[date_key].append(s)
                    added = True
                    break
            if not added:
                break

    for day in days_in_week:
        date_key = ds(day)
        is_event_day = date_key in event_afternoon_block_dates
        slots_today = SLOTS_MORNING + ([] if is_event_day else SLOTS_AFTERNOON)
        subjects_today = day_assignments[date_key]
        for i, subject_name in enumerate(subjects_today[:len(slots_today)]):
            subject = next((s for s in sem3_subjects if s.name == subject_name), None)
            if not subject:
                continue
            start, end = slots_today[i]
            db.add(Timetable(
                subject_id=subject.id,
                date=day,
                day=day.strftime("%A"),
                start_time=start,
                end_time=end,
                room=room_map.get(subject_name, "Room 101"),
                semester=3
            ))
            created += 1

db.commit()
print(f"Created {created} dated class sessions across {len(valid_teaching_days)} valid teaching days.")
db.close()