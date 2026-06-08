from fastapi import HTTPException
from app.schemas.task import New_Task
from app.schemas.task import Patch_Task
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
        task.status.value,
        task.description,
        task.priority.value,
    )


def patch_task(task_id, task):
    old_task = task_repo.get_task_id(task_id)

    if old_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    title = task.title if task.title is not None else old_task["title"]
    status = task.status.value if task.status is not None else old_task["status"]
    description = task.description if task.description is not None else old_task["description"]
    priority = task.priority.value if task.priority is not None else old_task["priority"]

    return task_repo.update_task(task_id, title, status, description, priority)


def delete_task(task_id: int):
    return task_repo.eliminate_task(task_id)