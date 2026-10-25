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
    slug: str | None = None
    names: dict[str, str] | None = None  # {"en": ..., "pt": ..., "es": ..., "fr": ...}
    body_part: str | None = None
    equipment: str | None = None
    type: str = "weight_reps"
