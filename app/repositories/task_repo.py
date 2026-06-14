from app.db.database import conn, cursor

# TUPLE into DICT function
def task_to_dict(task):
    return {
        "id": task[0],
        "title": task[1],
        "status": task[2],
        "description": task[3],
        "priority": task[4],
    }


def get_tasks():
    cursor.execute("""
        SELECT * FROM tasks
    """)
    tasks = cursor.fetchall()
    return [task_to_dict(t) for t in tasks]


def get_task_id(task_id: int):
    cursor.execute("""
        SELECT * FROM tasks
        WHERE id = %s
    """, (task_id,))

    task = cursor.fetchone()

    if task is None:
        return None

    return task_to_dict(task)


def new_task(title, status, description, priority):
    cursor.execute("""
        INSERT INTO tasks(title, status, description, priority)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """, (title, status, description, priority))

    new_id = cursor.fetchone()[0]

    conn.commit()

    return {
        "id": new_id,
        "title": title,
        "status": status,
        "description": description,
        "priority": priority,
    }


def update_task(task_id, title, status, description, priority):
    cursor.execute("""
        UPDATE tasks
        SET title = %s,
            status = %s,
            description = %s,
            priority = %s
        WHERE id = %s
    """, (title, status, description, priority, task_id))

    conn.commit()

    return task_id


def eliminate_task(task_id: int):
    cursor.execute("""
        DELETE FROM tasks
        WHERE id = %s
    """, (task_id,))

    conn.commit()

    return {"message": "Task deleted successfully"}