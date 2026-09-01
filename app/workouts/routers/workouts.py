from fastapi import APIRouter, Depends, HTTPException
from app.workouts.services import workout_service
from app.users.dependencies import get_current_user
from app.workouts.schemas.workout_schemas import NewWorkout, WorkoutOut, WorkoutSetOut

router = APIRouter(prefix="/workouts", tags=["workout"])

@router.get("", response_model=list[WorkoutOut])
def get_workouts(user=Depends(get_current_user)):
    return workout_service.get_workouts(user["id"])


@router.get("/{id}")
def get_workout(id, user=Depends(get_current_user)):
    workout = workout_service.get_workout(id, user["id"])
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout

@router.post("")
def new_workout(workout: NewWorkout, user=Depends(get_current_user)):
    workout_id = workout_service.new_workout(user["id"], workout)
    return {"id": workout_id}

@router.delete("/{id}")
def delete_workout(id, user=Depends(get_current_user)):
    workout = workout_service.delete_workout(user["id"], id)
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    return {"deleted": workout}