"""
=============================================================================
SQLITE PERSISTENCE MANAGER
=============================================================================
Course Project: Second-Year Computer Science & Engineering Mini-Project
Module: database.py

Manages SQLite storage for dream journal entries, handling schema
initialization, CRUD operations, indexing, and transactional integrity.
=============================================================================
"""

import sqlite3
import json
import time
import uuid
from typing import List, Dict, Any, Optional
from dream_analyzer import analyze_dream
from sample_data import SAMPLE_DREAMS

DB_PATH = "dreams.db"


def get_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with row factory configured as dictionary."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """
    Initializes the SQLite database schema if not already present.
    Creates table and performance indexes on date and creation timestamp.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS dreams (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                narrative TEXT NOT NULL,
                dream_date TEXT NOT NULL,
                dream_time TEXT,
                emotions TEXT,           -- JSON array of strings
                vividness INTEGER DEFAULT 5,
                tags TEXT,               -- JSON array of strings
                reflection TEXT,
                word_count INTEGER DEFAULT 0,
                char_count INTEGER DEFAULT 0,
                derived_symbols TEXT,    -- JSON array of detected symbol objects
                derived_keywords TEXT,   -- JSON array of strings
                is_sample INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
        """)

        # Performance Indexes for rapid sorting and filtering
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dreams_date ON dreams(dream_date);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dreams_created ON dreams(created_at);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_dreams_sample ON dreams(is_sample);")
        conn.commit()


def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Converts a SQLite Row into a cleanly deserialized Python dictionary."""
    data = dict(row)

    # Safely deserialize JSON fields
    for json_field in ["emotions", "tags", "derived_symbols", "derived_keywords"]:
        if data.get(json_field):
            try:
                data[json_field] = json.loads(data[json_field])
            except Exception:
                data[json_field] = []
        else:
            data[json_field] = []

    # Map database column names to user-friendly keys if needed
    data["selected_emotions"] = data.get("emotions", [])
    data["is_sample"] = bool(data.get("is_sample", 0))
    return data


def get_all_dreams(search: Optional[str] = None, emotion: Optional[str] = None, sort_by: str = "newest") -> List[Dict[str, Any]]:
    """
    Retrieves all dream records from SQLite with optional filtering and sorting.
    """
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM dreams WHERE 1=1"
        params: List[Any] = []

        # Text search across title, narrative, tags, and symbols
        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            query += " AND (LOWER(title) LIKE ? OR LOWER(narrative) LIKE ? OR LOWER(tags) LIKE ? OR LOWER(derived_symbols) LIKE ?)"
            params.extend([term, term, term, term])

        # Emotion filter
        if emotion and emotion.strip():
            emo_term = f'%"{emotion.strip()}"%'
            query += " AND emotions LIKE ?"
            params.append(emo_term)

        # Sorting logic
        if sort_by == "oldest":
            query += " ORDER BY dream_date ASC, created_at ASC"
        elif sort_by == "title":
            query += " ORDER BY LOWER(title) ASC"
        elif sort_by == "vividness":
            query += " ORDER BY vividness DESC, dream_date DESC"
        elif sort_by == "word_count":
            query += " ORDER BY word_count DESC"
        else:  # 'newest' default
            query += " ORDER BY dream_date DESC, created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [row_to_dict(row) for row in rows]


def get_dream_by_id(dream_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single dream record by unique ID."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM dreams WHERE id = ?", (dream_id,))
        row = cursor.fetchone()
        return row_to_dict(row) if row else None


def create_dream(data: Dict[str, Any], is_sample: int = 0) -> Dict[str, Any]:
    """
    Analyzes dream text and persists a new dream entry into SQLite.
    """
    init_db()
    dream_id = data.get("id") or f"dream-{int(time.time()*1000)}-{uuid.uuid4().hex[:6]}"
    title = data.get("title", "Untitled Dream").strip()
    narrative = data.get("narrative", "").strip()
    dream_date = data.get("dream_date", time.strftime("%Y-%m-%d"))
    dream_time = data.get("dream_time", time.strftime("%H:%M"))
    emotions = data.get("emotions") or data.get("selected_emotions") or []
    vividness = int(data.get("vividness", 5))
    tags = data.get("tags") or []
    reflection = data.get("reflection", "").strip()

    # Run Python text analysis
    analysis = analyze_dream(title, narrative, dream_date)
    now = int(time.time() * 1000)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO dreams (
                id, title, narrative, dream_date, dream_time,
                emotions, vividness, tags, reflection,
                word_count, char_count, derived_symbols, derived_keywords,
                is_sample, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            dream_id,
            title,
            narrative,
            dream_date,
            dream_time,
            json.dumps(emotions),
            vividness,
            json.dumps(tags),
            reflection,
            analysis["word_count"],
            analysis["char_count"],
            json.dumps(analysis["detected_symbols"]),
            json.dumps(analysis["keywords"]),
            is_sample,
            now,
            now
        ))
        conn.commit()

    return get_dream_by_id(dream_id)  # type: ignore


def update_dream(dream_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates an existing dream entry in SQLite and re-computes symbol derivatives."""
    init_db()
    existing = get_dream_by_id(dream_id)
    if not existing:
        return None

    title = data.get("title", existing["title"]).strip()
    narrative = data.get("narrative", existing["narrative"]).strip()
    dream_date = data.get("dream_date", existing["dream_date"])
    dream_time = data.get("dream_time", existing.get("dream_time", ""))
    emotions = data.get("emotions") if "emotions" in data else data.get("selected_emotions", existing.get("emotions", []))
    vividness = int(data.get("vividness", existing["vividness"]))
    tags = data.get("tags", existing.get("tags", []))
    reflection = data.get("reflection", existing.get("reflection", "")).strip()

    # Re-run analysis on updated text
    analysis = analyze_dream(title, narrative, dream_date)
    now = int(time.time() * 1000)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE dreams SET
                title = ?,
                narrative = ?,
                dream_date = ?,
                dream_time = ?,
                emotions = ?,
                vividness = ?,
                tags = ?,
                reflection = ?,
                word_count = ?,
                char_count = ?,
                derived_symbols = ?,
                derived_keywords = ?,
                updated_at = ?
            WHERE id = ?
        """, (
            title,
            narrative,
            dream_date,
            dream_time,
            json.dumps(emotions),
            vividness,
            json.dumps(tags),
            reflection,
            analysis["word_count"],
            analysis["char_count"],
            json.dumps(analysis["detected_symbols"]),
            json.dumps(analysis["keywords"]),
            now,
            dream_id
        ))
        conn.commit()

    return get_dream_by_id(dream_id)


def delete_dream(dream_id: str) -> bool:
    """Deletes a dream record from SQLite."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dreams WHERE id = ?", (dream_id,))
        conn.commit()
        return cursor.rowcount > 0


def seed_sample_dreams() -> int:
    """Loads the 10 fictional demonstration dreams into SQLite."""
    init_db()
    seeded = 0
    for sample in SAMPLE_DREAMS:
        existing = get_dream_by_id(sample["id"])
        if not existing:
            create_dream(sample, is_sample=1)
            seeded += 1
    return seeded


def clear_sample_dreams() -> int:
    """Removes only fictional sample dreams from SQLite, preserving user entries."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dreams WHERE is_sample = 1")
        conn.commit()
        return cursor.rowcount


def clear_all_dreams() -> int:
    """Clears all dreams from the SQLite database."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM dreams")
        conn.commit()
        return cursor.rowcount


def count_dreams() -> int:
    """Returns total dream count in SQLite."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM dreams")
        return cursor.fetchone()[0]
