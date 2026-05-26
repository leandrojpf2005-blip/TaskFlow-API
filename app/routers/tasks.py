from fastapi import APIRouter
from app.db.database import db
from app.schemas.task import Task
from fastapi import HTTPException

router = APIRouter()

@router.get("/")
def home():
    return {"message": "TaskFlow API is running"}

@router.get("/tasks")
def get_tasks():
    return db

@router.get("/tasks/{task_id}")
def get_task(task_id: int):
    for t in db:
        if t["id"] == task_id:
            return t

    raise HTTPException(status_code=404, detail="Task not found")

@router.post("/tasks")
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

@router.patch("/tasks/{task_id}")
def patch_title(task_id: int, task: Task):
    for t in db:
        if t["id"] == task_id:
            t["title"] = task.title
            return t

    raise HTTPException(status_code=404, detail="Task not found")

@router.delete("/tasks/{task_id}")
def tasks_delete(task_id: int):
    for t in db:
        if t["id"] == task_id:
            db.remove(t)
            return {"message": "Task deleted successfully"}

    raise HTTPException(status_code=404, detail="Task not found")