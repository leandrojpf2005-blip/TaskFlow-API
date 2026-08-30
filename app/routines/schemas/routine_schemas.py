from pydantic import BaseModel

class RoutineItemIn(BaseModel):
    exercise_id: int
    sets: int

class NewRoutine(BaseModel):
    name: str
    items: list[RoutineItemIn]

class RoutineOut(BaseModel):
    id: int
    name: str

class RoutineExerciseOut(BaseModel):
    id: int
    name: str
    sets: int
    exercise_id: int