from fastapi import APIRouter, Depends
from app.exercises import service as exercise_service
from app.users.dependencies import get_current_user
from app.exercises.schemas import NewExercise, ExerciseOut

router = APIRouter(prefix="/exercises", tags=["exercise"])

@router.get("", response_model=list[ExerciseOut])
def get_exercise(q: str | None = None, user=Depends(get_current_user)):
    return exercise_service.get_exercises(q)

@router.post("", response_model=ExerciseOut)
def new_exercise(exercise: NewExercise):
    return exercise_service.new_exercise(exercise)