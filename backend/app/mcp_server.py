"""
EduPilot AI — MCP server.

Exposes attendance/marks/timetable/notices lookups as proper MCP tools,
backed by the same Postgres database the FastAPI backend uses.

This is a SEPARATE process from your FastAPI backend (uvicorn app.main:app).
Run it with:  python mcp_server.py
Then any MCP client (Claude Desktop, an MCP-aware LangGraph agent, etc.)
can connect to it and call these tools via the standard MCP protocol —
not as hardcoded Python function calls inside a prompt.
"""
from mcp.server.fastmcp import FastMCP
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

mcp = FastMCP("EduPilot AI")


def run_query(sql: str, params: dict = None) -> list:
    db = SessionLocal()
    try:
        result = db.execute(text(sql), params or {})
        columns = result.keys()
        return [dict(zip(columns, row)) for row in result.fetchall()]
    finally:
        db.close()


@mcp.tool()
def get_attendance(student_id: int, semester: int = None) -> list:
    """Get a student's subject-wise attendance summary (present/total/percentage per subject).

    Args:
        student_id: The student's ID
        semester: Optional semester filter (1, 2, or 3). If omitted, returns all semesters.
    """
    sql = """
        SELECT s.name as subject, s.semester,
               COUNT(*) as total,
               SUM(CASE WHEN a.is_present THEN 1 ELSE 0 END) as present
        FROM attendance a
        JOIN subjects s ON a.subject_id = s.id
        WHERE a.student_id = :student_id
    """
    params = {"student_id": student_id}
    if semester is not None:
        sql += " AND s.semester = :semester"
        params["semester"] = semester
    sql += " GROUP BY s.name, s.semester"

    rows = run_query(sql, params)
    for r in rows:
        r["percentage"] = round((r["present"] / r["total"]) * 100, 2) if r["total"] else 0
    return rows


@mcp.tool()
def get_marks(student_id: int, semester: int = None) -> list:
    """Get a student's marks across all exams (Internal 1, Internal 2, External) per subject.

    Args:
        student_id: The student's ID
        semester: Optional semester filter (1, 2, or 3). If omitted, returns all semesters.
    """
    sql = """
        SELECT s.name as subject, s.semester, m.exam_type, m.marks_obtained, m.total_marks
        FROM marks m
        JOIN subjects s ON m.subject_id = s.id
        WHERE m.student_id = :student_id
    """
    params = {"student_id": student_id}
    if semester is not None:
        sql += " AND s.semester = :semester"
        params["semester"] = semester

    return run_query(sql, params)


@mcp.tool()
def get_timetable(semester: int) -> list:
    """Get the weekly class timetable for a given semester.

    Args:
        semester: Which semester's timetable to fetch (1, 2, or 3)
    """
    sql = """
        SELECT s.name as subject, t.date, t.day, t.start_time, t.end_time, t.room
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        WHERE t.semester = :semester
        ORDER BY t.date
    """
    return run_query(sql, {"semester": semester})


@mcp.tool()
def get_notices(limit: int = 10) -> list:
    """Get the most recent college notices/announcements.

    Args:
        limit: Maximum number of notices to return (default 10)
    """
    sql = "SELECT title, content, category, created_at FROM notices ORDER BY created_at DESC LIMIT :limit"
    return run_query(sql, {"limit": limit})


if __name__ == "__main__":
    mcp.run()