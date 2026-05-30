from app.db.database import conn, cursor
from fastapi import HTTPException
from app.schemas.task import Task
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
def create_task(task: Task):
    cursor.execute("""
    INSERT INTO tasks(title, status, description)
    VALUES (?, ?, ?)
""", (task.title, task.status, task.description))
    conn.commit()
    return {
        "title": task.title,
        "status":task.status,
        "description": task.description,
    }

#Patch an existed task
def patch_task(task_id: int, task: Task):
    cursor.execute("""
    UPDATE tasks 
    SET title = ?, status = ?, description =?
    WHERE id = ?
""", (task.title, task.status, task.description, task_id))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task updated successfully"}

#Delete tasks
def delete_task(task_id: int):
    cursor.execute("""
    DELETE FROM tasks WHERE id = ?
""", (task_id,))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}