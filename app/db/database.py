import sqlite3

conn = sqlite3.connect(
    "app/db/taskflow.db",
    check_same_thread=False
)
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL
)
""")

conn.commit()

