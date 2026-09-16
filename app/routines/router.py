from fastapi import APIRouter, Depends, HTTPException
from app.routines import service as routine_service
from app.users.dependencies import get_current_user
from app.routines.schemas import NewRoutine, RoutineOut, RoutineExerciseOut

router = APIRouter(prefix="/routines", tags=["routine"])

@router.get("", response_model=list[RoutineOut])
def get_routines(user=Depends(get_current_user)):
    return routine_service.get_routines(user["id"])

@router.get("/{id}", response_model=list[RoutineExerciseOut])
def get_routine(id, user=Depends(get_current_user)):
    routine = routine_service.get_routine(id, user["id"])
    if not routine:
            raise HTTPException(status_code=404, detail="Routine not found")
    return routine

@router.post("")
def create_routine(routine: NewRoutine, user=Depends(get_current_user)):
    routine_id = routine_service.create_routine(user["id"], routine)
    return {"id": routine_id}


@router.delete("/{id}")
def delete_routine(id, user=Depends(get_current_user)):
    routine = routine_service.delete_routine(user["id"], id)
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    return {"deleted": routine}