"""
One-off migration: adds the new `date` column to the `timetable` table.

Run this ONCE, before running full_calendar_rebuild_v2.py.
This drops and recreates the timetable table (safe here since we're about
to wipe + reseed all timetable data anyway in the rebuild script).
"""
from app.database.connection import engine
from app.database.models import Timetable, Base

print("Dropping existing timetable table...")
Timetable.__table__.drop(engine, checkfirst=True)

print("Recreating timetable table with the new schema (including `date` column)...")
Base.metadata.create_all(engine, tables=[Timetable.__table__])

print("Done. timetable table now has the `date` column.")