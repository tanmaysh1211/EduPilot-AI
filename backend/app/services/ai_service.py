"""
EduPilot AI chat agent — LangGraph version.

Replaces the old single-call ai_service.py with a small agent graph:

    [classify_intent] --> "sql"      --> [generate_sql] --> [validate_sql] --> [execute_sql] --> [synthesize_answer]
                      \\-> "notices"  --> [fetch_notices] -------------------------------------> [synthesize_answer]
                       \\-> "general" --> [general_chat] -------------------------------------------------------> END

This is intentionally a small graph (3 routes, ~6 nodes) — the point is
demonstrating real conditional routing + tool use, not maximal complexity.
"""
from typing import TypedDict, Literal, Optional
from langgraph.graph import StateGraph, END
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
import os
import re

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"

DB_SCHEMA = """
Tables in database:
1. users(id, email, role)
2. students(id, user_id, name, roll_number, department, semester)
3. subjects(id, name, code, semester, department)
4. attendance(id, student_id, subject_id, date, is_present)
5. marks(id, student_id, subject_id, exam_type, marks_obtained, total_marks)
6. timetable(id, subject_id, day, start_time, end_time, room, semester)
7. notices(id, title, content, created_at, category)
"""

# ---------------------------------------------------------------------------
# SQL safety guardrail — the single most important change from the old code.
# The old version let the LLM's SQL run completely unchecked, including
# DELETE/UPDATE/DROP. This allowlists SELECT-only and blocks dangerous keywords.
# ---------------------------------------------------------------------------
BLOCKED_KEYWORDS = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "GRANT", "REVOKE", "CREATE", "EXEC", ";--"]


def is_sql_safe(sql: str) -> tuple[bool, str]:
    stripped = sql.strip().rstrip(";").strip()
    if not stripped.upper().startswith("SELECT"):
        return False, "Only SELECT queries are allowed."
    upper = stripped.upper()
    for kw in BLOCKED_KEYWORDS:
        if kw in upper:
            return False, f"Query contains a blocked keyword: {kw}"
    if ";" in stripped:
        return False, "Multiple statements are not allowed."
    return True, ""


# ---------------------------------------------------------------------------
# Agent state — what flows through the graph
# ---------------------------------------------------------------------------
class AgentState(TypedDict):
    question: str
    student_id: int
    history: list  # list of {"role": "user"|"assistant", "content": str} — recent turns for memory
    intent: Optional[Literal["sql", "notices", "general"]]
    sql: Optional[str]
    sql_error: Optional[str]
    data: list
    answer: str


# ---------------------------------------------------------------------------
# Node: classify_intent — router node
# ---------------------------------------------------------------------------
def classify_intent(state: AgentState) -> AgentState:
    history_text = "\n".join(f"{h['role']}: {h['content']}" for h in state.get("history", [])[-4:])
    prompt = f"""Classify the student's question into exactly one category. Reply with ONLY one word.

Categories:
- sql: questions about the student's own attendance, marks, timetable, or subjects (structured data lookups)
- notices: questions about college notices, announcements, exam dates, holidays, general college info
- general: greetings, small talk, anything unrelated to academics

Recent conversation (for context):
{history_text}

Question: {state['question']}

Reply with exactly one word: sql, notices, or general."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    intent = response.choices[0].message.content.strip().lower()
    if intent not in ("sql", "notices", "general"):
        intent = "general"
    state["intent"] = intent
    return state


# ---------------------------------------------------------------------------
# Node: generate_sql_node
# ---------------------------------------------------------------------------
def generate_sql_node(state: AgentState) -> AgentState:
    history_text = "\n".join(f"{h['role']}: {h['content']}" for h in state.get("history", [])[-4:])
    prompt = f"""You are a SQL expert. Generate a single PostgreSQL SELECT query based on the question.

Database Schema:
{DB_SCHEMA}

Recent conversation (the question may be a follow-up, e.g. "what about DBMS?"):
{history_text}

Rules:
- Generate ONLY a SELECT query, nothing else
- Always filter by student_id = {state['student_id']} for student-specific data
- No markdown, no explanation, no backticks, no semicolon
- Use proper JOINs when needed

Question: {state['question']}
SQL Query:"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    sql = response.choices[0].message.content.strip()
    sql = re.sub(r'```sql|```', '', sql).strip()
    state["sql"] = sql
    return state


# ---------------------------------------------------------------------------
# Node: validate_and_execute_sql
# ---------------------------------------------------------------------------
def make_validate_and_execute_node(db: Session):
    def validate_and_execute(state: AgentState) -> AgentState:
        sql = state.get("sql", "")
        safe, reason = is_sql_safe(sql)
        if not safe:
            state["sql_error"] = reason
            state["data"] = []
            return state
        try:
            result = db.execute(text(sql))
            rows = result.fetchall()
            columns = result.keys()
            state["data"] = [dict(zip(columns, row)) for row in rows]
            state["sql_error"] = None
        except Exception as e:
            state["sql_error"] = str(e)
            state["data"] = []
        return state
    return validate_and_execute


# ---------------------------------------------------------------------------
# Node: fetch_notices — simple retrieval tool (keyword-based for now;
# this is the natural slot to upgrade to real embedding-based RAG later)
# ---------------------------------------------------------------------------
def make_fetch_notices_node(db: Session):
    def fetch_notices(state: AgentState) -> AgentState:
        try:
            result = db.execute(text("SELECT title, content, category FROM notices ORDER BY created_at DESC LIMIT 10"))
            rows = result.fetchall()
            columns = result.keys()
            state["data"] = [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            state["data"] = []
            state["sql_error"] = str(e)
        return state
    return fetch_notices


# ---------------------------------------------------------------------------
# Node: synthesize_answer — turns data into a friendly Hinglish reply
# ---------------------------------------------------------------------------
def synthesize_answer(state: AgentState) -> AgentState:
    if state.get("sql_error"):
        state["answer"] = "Sorry yaar, data fetch karne mein problem aa gayi. Phir try karo! 😅"
        return state

    prompt = f"""You are EduPilot AI, a helpful college ERP assistant.
Answer the student's question in a friendly, conversational way in Hinglish (mix of Hindi and English).

Question: {state['question']}
Data from database: {state['data']}

Rules:
- Be friendly and helpful
- Keep answer concise
- If data is empty, say no data found
- Format numbers nicely
- Use emojis occasionally"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    state["answer"] = response.choices[0].message.content.strip()
    return state


# ---------------------------------------------------------------------------
# Node: general_chat — direct LLM response, no data lookup
# ---------------------------------------------------------------------------
def general_chat(state: AgentState) -> AgentState:
    history_text = "\n".join(f"{h['role']}: {h['content']}" for h in state.get("history", [])[-4:])
    prompt = f"""You are EduPilot AI, a friendly assistant for college students.
Answer the question helpfully in Hinglish (mix of Hindi and English).

Recent conversation:
{history_text}

Question: {state['question']}

Rules:
- Be friendly and warm
- Keep answer concise (2-4 sentences)
- Use emojis occasionally
- Gently remind them you can also answer academic questions"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )
    state["answer"] = response.choices[0].message.content.strip()
    state["data"] = []
    return state


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------
def build_agent_graph(db: Session):
    graph = StateGraph(AgentState)

    graph.add_node("classify_intent", classify_intent)
    graph.add_node("generate_sql", generate_sql_node)
    graph.add_node("validate_and_execute", make_validate_and_execute_node(db))
    graph.add_node("fetch_notices", make_fetch_notices_node(db))
    graph.add_node("synthesize_answer", synthesize_answer)
    graph.add_node("general_chat", general_chat)

    graph.set_entry_point("classify_intent")

    graph.add_conditional_edges(
        "classify_intent",
        lambda state: state["intent"],
        {
            "sql": "generate_sql",
            "notices": "fetch_notices",
            "general": "general_chat",
        }
    )

    graph.add_edge("generate_sql", "validate_and_execute")
    graph.add_edge("validate_and_execute", "synthesize_answer")
    graph.add_edge("fetch_notices", "synthesize_answer")
    graph.add_edge("synthesize_answer", END)
    graph.add_edge("general_chat", END)

    return graph.compile()


def chat_with_ai(db: Session, question: str, student_id: int, history: list = None) -> dict:
    app = build_agent_graph(db)
    initial_state: AgentState = {
        "question": question,
        "student_id": student_id,
        "history": history or [],
        "intent": None,
        "sql": None,
        "sql_error": None,
        "data": [],
        "answer": "",
    }
    final_state = app.invoke(initial_state)
    return {
        "question": question,
        "answer": final_state["answer"],
        "intent": final_state["intent"],
        "sql_used": final_state.get("sql") or "",
        "data": final_state.get("data", []),
    }


def chat_with_ai_stream(db: Session, question: str, student_id: int, history: list = None):
    """
    Streaming version: runs the same graph up through data-gathering
    (classify -> sql/notices/general), then streams the FINAL answer
    token-by-token instead of waiting for the whole completion.

    Yields dicts: {"type": "meta", ...} once, then {"type": "token", "content": "..."} repeatedly,
    then {"type": "done", ...} at the end.
    """
    state: AgentState = {
        "question": question,
        "student_id": student_id,
        "history": history or [],
        "intent": None,
        "sql": None,
        "sql_error": None,
        "data": [],
        "answer": "",
    }

    # Run everything up to (but not including) the final answer-generation step manually,
    # reusing the same node functions the graph uses — this keeps routing/SQL logic identical,
    # we just swap the LAST step (LLM call) for a streaming call instead of a blocking one.
    state = classify_intent(state)

    db_local = db
    if state["intent"] == "sql":
        state = generate_sql_node(state)
        state = make_validate_and_execute_node(db_local)(state)
    elif state["intent"] == "notices":
        state = make_fetch_notices_node(db_local)(state)
    # "general" needs no data step

    yield {"type": "meta", "intent": state["intent"], "sql_used": state.get("sql") or "", "data": state.get("data", [])}

    if state.get("sql_error"):
        yield {"type": "token", "content": "Sorry yaar, data fetch karne mein problem aa gayi. Phir try karo! 😅"}
        yield {"type": "done"}
        return

    if state["intent"] == "general":
        history_text = "\n".join(f"{h['role']}: {h['content']}" for h in state.get("history", [])[-4:])
        prompt = f"""You are EduPilot AI, a friendly assistant for college students.
Answer the question helpfully in Hinglish (mix of Hindi and English).

Recent conversation:
{history_text}

Question: {state['question']}

Rules:
- Be friendly and warm
- Keep answer concise (2-4 sentences)
- Use emojis occasionally
- Gently remind them you can also answer academic questions"""
    else:
        prompt = f"""You are EduPilot AI, a helpful college ERP assistant.
Answer the student's question in a friendly, conversational way in Hinglish (mix of Hindi and English).

Question: {state['question']}
Data from database: {state['data']}

Rules:
- Be friendly and helpful
- Keep answer concise
- If data is empty, say no data found
- Format numbers nicely
- Use emojis occasionally"""

    stream = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield {"type": "token", "content": delta}

    yield {"type": "done"}