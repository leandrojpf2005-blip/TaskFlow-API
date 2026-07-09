from fastapi import HTTPException
from app.workspaces.repositories import workspace_repo
from app.workspaces.schemas.workspace_schemas import NewWorkspace



def get_all_workspaces():
    return workspace_repo.get_workspaces()

def create_workspace(workspace: NewWorkspace):
    return workspace_repo.new_workspace(
        workspace.name
    )

def delete_workspace(workspace_id: int):
    workspace = workspace_repo.get_workspace_by_id(workspace_id)

    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    workspace_repo.delete_workspace(workspace_id)

    return {"message": "Workspace deleted successfully"}