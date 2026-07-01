from fastapi import HTTPException
from app.tasks.schemas.task_schemas import NewTask
from app.tasks.schemas.task_schemas import Patch_Task
from app.tasks.repositories import task_repo


def get_all_tasks(workspace_id: int):
    return task_repo.get_tasks(workspace_id)


def get_task_by_id(task_id: int):
    task = task_repo.get_task_id(task_id)

    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


def create_task(task: NewTask):
    return task_repo.new_task(
        task.title,
        task.status.value,
        task.description,
        task.priority.value,
        task.due_date,
    )


def patch_task(task_id: int, task: Patch_Task):
    old_task = task_repo.get_task_id(task_id)

    if old_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    if old_task["status"] == "finished":
        raise HTTPException(status_code=400, detail="You cannot edit finished tasks")

    title = task.title if task.title is not None else old_task["title"]
    status = task.status.value if task.status else old_task["status"]
    description = task.description if task.description is not None else old_task["description"]
    priority = task.priority.value if task.priority else old_task["priority"]
    due_date = task.due_date if task.due_date is not None else old_task["due_date"]

    if old_task["status"] == "not_started" and status == "finished":
        raise HTTPException(status_code=400, detail="You cannot finish a not started task")

    return task_repo.update_task(
        task_id,
        title,
        status,
        description,
        priority,
        due_date,
    )


def delete_task(task_id: int):
    return task_repo.eliminate_task(task_id)