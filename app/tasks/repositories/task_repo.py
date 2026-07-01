from app.db.database import conn, cursor
import psycopg2.extras

cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

def get_tasks(workspace_id: int):
    cursor.execute("""
        SELECT * FROM tasks
        WHERE workspace_id = %s
    """)
    tasks = cursor.fetchall()
    return tasks


def get_task_id(task_id: int):
    cursor.execute("""
        SELECT * FROM tasks
        WHERE id = %s
    """, (task_id,))

    task = cursor.fetchone()

    if task is None:
        return None

    return task


def new_task(title, description, priority, due_date):
    status = "not_started"

    cursor.execute("""
        INSERT INTO tasks(title, status, description, priority, due_date)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id
    """, (title, status, description, priority, due_date))

    new_id = cursor.fetchone()["id"]
    conn.commit()

    return {
        "id": new_id,
        "title": title,
        "status": status,
        "description": description,
        "priority": priority,
        "due_date": due_date,
    }


def update_task(task_id, title, status, description, priority, due_date):
    cursor.execute("""
        UPDATE tasks
        SET title = %s,
            status = %s,
            description = %s,
            priority = %s,
            due_date = %s
        WHERE id = %s
    """, (title, status, description, priority, due_date, task_id))

    conn.commit()

    return task_id


def eliminate_task(task_id: int):
    cursor.execute("""
        DELETE FROM tasks
        WHERE id = %s
    """, (task_id,))

    conn.commit()

    return {"message": "Task deleted successfully"}