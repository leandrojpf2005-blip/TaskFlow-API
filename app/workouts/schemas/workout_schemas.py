from pydantic import BaseModel
from datetime import datetime


# ---- workout_set (the children — one logged set) ----

class WorkoutSetIn(BaseModel):
    exercise_id: int
    reps: int
    weight: float
    set_number: int

class WorkoutSetOut(BaseModel):
    id: int
    exercise_id: int
    name: str | None = None      # exercise name — filled by the JOIN in get_workout
    reps: int
    weight: float
    set_number: int


# ---- workout (the parent — a session) ----

class NewWorkout(BaseModel):
    routine_id: int | None = None    # optional: a freestyle workout has no routine
    date: datetime | None = None     # optional: backend can default to now()
    duration: int | None = None      # seconds
    sets: list[WorkoutSetIn]

class WorkoutOut(BaseModel):
    id: int
    routine_id: int | None = None
    date: datetime
    duration: int | None = None
