from pydantic import BaseModel

class Task(BaseModel):
    title: str
    status: str = "not_started"
    description: str