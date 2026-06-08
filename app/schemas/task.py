from pydantic import BaseModel, Field
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
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    status: Status
    priority: Priority

class Patch_Task(BaseModel):
    title: Optional[str]
    description: Optional[str]
    status: Optional[Status]
    priority: Optional[Priority]