from fastapi import APIRouter
from app.workspaces.services import workspace_service
from app.workspaces.schemas.workspace_schemas import NewWorkspace
from fastapi import HTTPException

router = APIRouter()

@router.get("/workspaces")
def get_workspaces():
    return workspace_service.get_all_workspaces()

@router.post("/workspaces")
def post_workspace(workspace: NewWorkspace):
    return workspace_service.create_workspace(workspace)

@router.delete("/workspaces/{workspace_id}")
def delete_workspace(workspace_id: int):
    return workspace_service.delete_workspace(workspace_id)