from pydantic import BaseModel
from enum import Enum
from typing import Optional

class Status(Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS =  "in_progress"
    FINISHED = "finished"

class Priority(Enum):
    NONE = "no_priority"
    LOW = "low_priority"
    NORMAL = "normal_priority"
    HIGH = "high_priority"
    VERY_HIGH = "very_high_priority"

class New_Task(BaseModel):
    title: str
    description: str
    status: Status

class Patch_Task(BaseModel):
    title: Optional[str]
    description: Optional[str]
    status: Optional[Status]