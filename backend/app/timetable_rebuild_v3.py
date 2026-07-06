from app.database.connection import SessionLocal
from app.database.models import Holiday, Timetable, Subject
from datetime import datetime, timedelta
import calendar as pycalendar

db = SessionLocal()

print("=== Sem 3 calendar rebuild v3: credit-driven classes, stricter exam-gap rules ===\n")

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


def ds(dt):
    return dt.strftime("%Y-%m-%d")


classes_commence = third_week_monday(2026, 7)
internal1_start = third_week_monday(2026, 8)
internal2_start = third_week_monday(2026, 9)
external_start = third_week_monday(2026, 11)

# ---------------------------------------------------------------------------
# STEP 1: holiday/event ground truth (unchanged from before)
# ---------------------------------------------------------------------------
calendar_entries = {}


def add_entry(date_str_, label, htype):
    calendar_entries.setdefault(date_str_, []).append((label, htype))


def is_blocked(date_str_):
    return date_str_ in calendar_entries


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

# ---------------------------------------------------------------------------
# STEP 2: exam sequencing
# Internal 1 / Internal 2: 1-day gap minimum between exams, gap days stay OPEN for classes
# External: 1-day gap minimum between exams, gap days are BLOCKED for classes (NEW RULE)
# ---------------------------------------------------------------------------
SUBJECTS_IN_ORDER = [s.name for s in sem3_subjects][:5] or \
    ["Data Structures", "DBMS", "Operating Systems", "Computer Networks", "Web Technologies"]

# subject_id lookup for later credit-based scheduling
subject_by_name = {s.name: s for s in sem3_subjects}


def schedule_exam_sequence(start_dt, exam_label):
    """Places one exam per non-blocked day, 1-day minimum gap. Returns (dates, day_after_last)."""
    d = start_dt
    scheduled = 0
    last_exam_date = None
    dates = []
    while scheduled < len(SUBJECTS_IN_ORDER):
        date_key = ds(d)
        gap_ok = last_exam_date is None or (d - last_exam_date).days >= 2
        if not is_blocked(date_key) and gap_ok:
            subject = SUBJECTS_IN_ORDER[scheduled]
            add_entry(date_key, f"{exam_label}: {subject}", "exam")
            dates.append(d)
            last_exam_date = d
            scheduled += 1
        d += timedelta(days=1)
    return dates, d


internal1_dates, internal1_end = schedule_exam_sequence(internal1_start, "Internal 1")
internal2_dates, internal2_end = schedule_exam_sequence(internal2_start, "Internal 2")
external_dates, external_end = schedule_exam_sequence(external_start, "External")

# NEW: block every day from the FIRST external exam to the LAST external exam
# (this covers exam days themselves AND any gap days between them)
external_block_start = external_dates[0]
external_block_end = external_dates[-1]
d = external_block_start
while d <= external_block_end:
    date_key = ds(d)
    if date_key not in calendar_entries:
        # gap day within the external block that isn't already an exam entry — mark it blocked
        # (we don't add a visible calendar label for it, just block it from teaching)
        pass
    d += timedelta(days=1)

# Study leave: 1 week immediately before the FIRST external exam
study_leave_start = external_block_start - timedelta(days=7)
add_entry(ds(external_end), "Semester Ends", "holiday")
SEM_TEACHING_END = study_leave_start - timedelta(days=1)  # classes must stop here

for date_key, entries in calendar_entries.items():
    for label, htype in entries:
        db.add(Holiday(date=datetime.strptime(date_key, "%Y-%m-%d"), label=label, type=htype))
db.commit()

print(f"Classes commence: {classes_commence.strftime('%d %b %Y')}")
print(f"Internal 1 exams: {[d.strftime('%d %b') for d in internal1_dates]}")
print(f"Internal 2 exams: {[d.strftime('%d %b') for d in internal2_dates]}")
print(f"External exams:   {[d.strftime('%d %b') for d in external_dates]}")
print(f"Study leave starts: {study_leave_start.strftime('%d %b %Y')} (classes must stop by {SEM_TEACHING_END.strftime('%d %b')})")
print(f"Semester ends: {external_end.strftime('%d %b %Y')}\n")

# ---------------------------------------------------------------------------
# STEP 3: build the FULL set of blocked dates for regular teaching
# (holidays/events from calendar_entries, PLUS the external exam block's gap days,
# PLUS the study leave week)
# ---------------------------------------------------------------------------
blocked_for_teaching = set(calendar_entries.keys())

d = external_block_start
while d <= external_block_end:
    blocked_for_teaching.add(ds(d))  # blocks exam days AND gap days within external block
    d += timedelta(days=1)

d = study_leave_start
while d < external_block_start:
    blocked_for_teaching.add(ds(d))
    d += timedelta(days=1)

valid_teaching_days = []
d = classes_commence
while d <= SEM_TEACHING_END:
    date_key = ds(d)
    if d.weekday() != 6 and date_key not in blocked_for_teaching:
        valid_teaching_days.append(d)
    d += timedelta(days=1)

print(f"Total valid teaching days: {len(valid_teaching_days)}\n")

# ---------------------------------------------------------------------------
# STEP 4: generate dated class sessions, credit-driven weekly targets
# ---------------------------------------------------------------------------
SLOTS_MORNING = [("09:00", "10:00"), ("10:30", "11:30")]
SLOTS_AFTERNOON = [("13:30", "14:30"), ("14:30", "15:30"), ("15:30", "16:30")]

ROOMS = ["Room 101", "Room 102", "Lab 1", "Room 201", "Room 202"]
room_map = dict(zip(SUBJECTS_IN_ORDER, ROOMS))

# Credit-driven weekly target: subject.credits IS the weekly class count
weekly_counts_target = {}
total_target = {}
for name in SUBJECTS_IN_ORDER:
    subject = subject_by_name.get(name)
    credits = subject.credits if subject and subject.credits else 3
    weekly_counts_target[name] = credits
    total_target[name] = credits * 12  # 12 teaching weeks => 36 or 48 total

print("Weekly class targets (= credits):", weekly_counts_target)
print("Total semester targets:", total_target, "\n")

weeks = {}
for day in valid_teaching_days:
    week_key = day.strftime("%Y-W%U")
    weeks.setdefault(week_key, []).append(day)

scheduled_count = {name: 0 for name in SUBJECTS_IN_ORDER}
created = 0

for week_key, days_in_week in weeks.items():
    remaining_this_week = {}
    for name in SUBJECTS_IN_ORDER:
        still_needed_total = total_target[name] - scheduled_count[name]
        remaining_this_week[name] = min(weekly_counts_target[name], max(still_needed_total, 0))

    day_assignments = {ds(day): [] for day in days_in_week}

    attempts = 0
    while any(v > 0 for v in remaining_this_week.values()) and attempts < 200:
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

        candidates = [s for s, c in remaining_this_week.items() if c > 0 and s not in day_assignments[date_key]]
        if not candidates:
            break
        subject_name = max(candidates, key=lambda s: remaining_this_week[s])
        day_assignments[date_key].append(subject_name)
        remaining_this_week[subject_name] -= 1
        scheduled_count[subject_name] += 1

    for day in days_in_week:
        date_key = ds(day)
        is_event_day = date_key in event_afternoon_block_dates
        slots_today = SLOTS_MORNING + ([] if is_event_day else SLOTS_AFTERNOON)
        subjects_today = day_assignments[date_key]
        for i, subject_name in enumerate(subjects_today[:len(slots_today)]):
            subject = subject_by_name.get(subject_name)
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
print(f"Created {created} dated class sessions.")
print("Final scheduled counts vs targets:")
for name in SUBJECTS_IN_ORDER:
    status = "OK" if scheduled_count[name] >= total_target[name] else f"SHORT by {total_target[name] - scheduled_count[name]}"
    print(f"  {name}: {scheduled_count[name]} / {total_target[name]} ({status})")

db.close()