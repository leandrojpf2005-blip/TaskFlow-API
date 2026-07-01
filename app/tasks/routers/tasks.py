from fastapi import APIRouter
from app.tasks.services import task_service
from app.tasks.schemas.task_schemas import NewTask, Patch_Task   
from fastapi import HTTPException


router = APIRouter()

@router.get("/")
def home():
    return {"message": "TaskFlow API is running"}

@router.get("/tasks")
def get_tasks(workspace_id: int):
    return task_service.get_all_tasks(workspace_id)

@router.get("/tasks/{task_id}")
def get_task_id(task_id: int):
    return task_service.get_task_by_id(task_id)

@router.post("/tasks")
def post_task(task: NewTask):
    return task_service.create_task(task)

@router.patch("/tasks/{task_id}")
def patch(task_id: int, task: Patch_Task):
    return task_service.patch_task(task_id, task)

@router.delete("/tasks/{task_id}")
def delete(task_id: int):
    return task_service.delete_task(task_id)