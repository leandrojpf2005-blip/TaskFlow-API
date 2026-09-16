from app.workouts import repository as workout_repo
from app.workouts.schemas import NewWorkout

def new_workout(user_id, workout: NewWorkout):
    return workout_repo.new_workout(
        user_id,
        workout.routine_id,
        workout.duration,
        workout.sets
    )

def get_workouts(user_id):
    return workout_repo.get_workouts(user_id)

def get_workout(id, user_id):
    workout = workout_repo.get_workout(id, user_id)
    if workout is None:
        return None
    sets = workout_repo.get_workout_sets(id, user_id)
    volume = workout_repo.get_workout_volume(id)
    return {**workout, "sets": sets, "volume": volume}

def delete_workout(user_id, id):
    return workout_repo.delete_workout(user_id, id)