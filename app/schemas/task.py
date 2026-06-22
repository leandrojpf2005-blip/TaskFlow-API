from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional
from datetime import datetime


class Status(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
    PAUSED ="paused"


class Priority(str, Enum):
    NONE = "no_priority"
    LOW = "low_priority"
    NORMAL = "normal_priority"
    HIGH = "high_priority"
    VERY_HIGH = "very_high_priority"


class NewTask(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    status: Status
    priority: Priority
    due_date: Optional[datetime] = None


class Patch_Task(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Status] = None
    priority: Optional[Priority] = None
    due_date: Optional[datetime] = None