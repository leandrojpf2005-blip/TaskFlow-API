from pydantic import BaseModel
from datetime import datetime


class WorkoutSetIn(BaseModel):
    exercise_id: int
    reps: int
    weight: float
    set_number: int

class WorkoutSetOut(BaseModel):
    id: int
    exercise_id: int
    name: str | None = None      
    reps: int
    weight: float
    set_number: int


class NewWorkout(BaseModel):
    routine_id: int | None = None  
    date: datetime | None = None   
    duration: int | None = None     
    sets: list[WorkoutSetIn]

class WorkoutOut(BaseModel):
    id: int
    routine_id: int | None = None
    date: datetime
    duration: int | None = None
