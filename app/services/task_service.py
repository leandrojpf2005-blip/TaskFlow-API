from app.db.database import db
from fastapi import HTTPException
from app.schemas.task import Task


#Get all tasks
def get_all_tasks():
    return db

#Get tasks by id
def get_task_by_id(task_id: int):
    for t in db:
        if t["id"] == task_id:
            return t
        
    raise HTTPException(status_code=404, detail="Task not found")

#Create a new task
def create_task(task: Task):
    new_id = len(db) + 1
    new_task = {
        "id": new_id,
        "title": task.title,
        "status": task.status,
        "description": task.description,
    }
    db.append(new_task)
    return new_task

#Patch an existed task
def patch_task(task_id: int, task: Task):
    for t in db:
        if t["id"] == task_id:
            t["title"] = task.title
            t["status"] = task.status
            t["description"] = task.description
            return t
    
    raise HTTPException(status_code=404, detail="Task not found")

#Delete tasks
def delete_task(task_id: int):
    for t in db:
        if t["id"] == task_id:
            db.remove(t)
            return {"message": "Task deleted sucessfully"}
        
    raise HTTPException(status_code=404, detail="Task not found")