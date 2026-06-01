from app.db.database import conn, cursor
from fastapi import HTTPException
from app.schemas.task import New_Task
from app.schemas.task import Patch_Task


#TUPLE into DICT function
def task_to_dict(task):
    return{
        "id": task[0],
        "title": task[1],
        "status": task[2],
        "description": task[3],
    }


#Get all tasks
def get_all_tasks():
    cursor.execute("""
    SELECT * FROM tasks
""")
    tasks = cursor.fetchall()
    return [task_to_dict(t) for t in tasks]

#Get tasks by id
def get_task_by_id(task_id: int):
    cursor.execute("""
    SELECT * FROM tasks
    WHERE id = ?
""", (task_id,))
    task = cursor.fetchone()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_dict(task)

#Create a new task
def create_task(task: New_Task):
    cursor.execute("""
    INSERT INTO tasks(title, status, description)
    VALUES (?, ?, ?)
""", (task.title, task.status.value, task.description))
    new_id = cursor.lastrowid
    conn.commit()
    return {
        "id": new_id,
        "title": task.title,
        "status":task.status,
        "description": task.description,
    }

#Patch an existed task
def patch_task(task_id: int, task: Patch_Task):
    cursor.execute("""
    SELECT * FROM tasks where id = ?
""",(task_id,))
    old_task = cursor.fetchone()
    if old_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    old = task_to_dict(old_task)
    new_title = task.title if task.title is not None else old["title"]
    new_status = task.status.value if task.status is not None else old["status"]
    new_description = task.description if task.description is not None else old["description"]
    cursor.execute("""
    Update tasks SET title = ?, status = ?, description = ?
    WHERE id = ?
""", (new_title, new_status, new_description, task_id,))
    conn.commit()
    return { "id": task_id, "title": new_title, "status": new_status, "description": new_description, }

#Delete tasks
def delete_task(task_id: int):
    cursor.execute("""
    DELETE FROM tasks WHERE id = ?
""", (task_id,))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}