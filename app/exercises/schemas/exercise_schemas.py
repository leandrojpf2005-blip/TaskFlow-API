from pydantic import BaseModel

class NewExercise(BaseModel):
    name: str
    primary_muscles: list[str]
    instructions: list[str] | None = None

class ExerciseOut(BaseModel):
    id: int
    name: str
    primary_muscles: list[str]
    secondary_muscles: list[str] | None = None
    instructions: list[str] | None = None
    images: list[str] | None = None
