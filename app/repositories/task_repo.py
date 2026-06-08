from app.db.database import conn, cursor

#TUPLE into DICT function
def task_to_dict(task):
    return{
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
    WHERE id = ?
""", (task_id,))
    task = cursor.fetchone()
    if task is None:
        return None
    return task_to_dict(task)

def new_task(title, status, description, priority):
    cursor.execute("""
    INSERT INTO tasks(title, status, description, priority)
    VALUES (?, ?, ?, ?)
""", (title, status, description, priority,))
    new_id = cursor.lastrowid
    new_task = {
        "id": new_id,
        "title": title,
        "status": status, 
        "description": description,
        "priority": priority,
}
    conn.commit()
    return new_task

def update_task(task_id, title, status, description, priority):
    cursor.execute("""
        UPDATE tasks
        SET title = ?, status = ?, description = ?, priority = ?
        WHERE id = ?
    """, (title, status, description, priority, task_id))

    conn.commit()

    return task_id

def eliminate_task(task_id: int):
    cursor.execute("""
    DELETE FROM tasks WHERE id = ?
""", (task_id,))
    conn.commit()
    return {"message": "Task deleted successfully"}