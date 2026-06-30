from pydantic import BaseModel

class WorkspaceBase(BaseModel):
    name: str

class NewWorkspace(WorkspaceBase):
    pass

class WorkspaceOut(WorkspaceBase):
    id: int