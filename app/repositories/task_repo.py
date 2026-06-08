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
        "status": status.value, 
        "description": description,
        "priority": priority.value,
}
    conn.commit()
    return new_task

def update_task(task_id: int, task: Patch_Task):
    cursor.execute("""
    SELECT * FROM tasks
    WHERE id = ?
""", (task_id,))
    old_task = cursor.fetchone()
    if old_task is None:
        return None
    old = task_to_dict(old_task)
    new_title = task.title if task.title is not None else old["title"]
    new_status = task.status.value if task.status is not None else old["status"]
    new_description = task.description if task.description is not None else old["description"]
    new_priority = task.priority.value if task.priority is not None else old["priority"]
    cursor.execute("""
    Update tasks SET title = ?, status = ?, description = ?, priority = ?
    WHERE id = ?
""", (new_title, new_status, new_description, new_priority, task_id,))
    return { "id": task_id, "title": new_title, "status": new_status, "description": new_description, "priority": new_priority }

def eliminate_task(task_id: int):
    cursor.execute("""
    DELETE FROM tasks WHERE id = ?
""", (task_id,))
    conn.commit()
    return {"message": "Task deleted successfully"}