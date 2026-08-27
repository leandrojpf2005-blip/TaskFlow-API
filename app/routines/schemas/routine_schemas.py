from pydantic import BaseModel

class RoutineItemIn(BaseModel):
    exercise_id: int
    sets: int

class NewRoutine(BaseModel):
    name: str
    items: list[RoutineItemIn]