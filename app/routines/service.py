from app.routines import repository as routine_repo
from app.routines.schemas import NewRoutine

def create_routine(user_id, routine: NewRoutine):
    return routine_repo.create_routine(
        user_id,
        routine.name,
        routine.items
    )

def get_routines(user_id):
    return routine_repo.get_routines(user_id)

def get_routine(id, user_id):
    return routine_repo.get_routine(id, user_id)

def delete_routine(user_id, id):
    return routine_repo.delete_routine(user_id, id)