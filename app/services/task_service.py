from fastapi import HTTPException
from app.schemas.task import New_Task, Patch_Task
from app.repositories import task_repo


def get_all_tasks():
    return task_repo.get_tasks()


def get_task_by_id(task_id: int):
    task = task_repo.get_task_id(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


def create_task(task: New_Task):
    return task_repo.new_task(
        task.title,
        task.status,
        task.description,
        task.priority
    )


def patch_task(task_id: int, task: Patch_Task):
    updated_task = task_repo.update_task(task_id, task)

    if updated_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return updated_task


def delete_task(task_id: int):
    return task_repo.eliminate_task(task_id)