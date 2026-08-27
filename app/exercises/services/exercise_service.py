from app.exercises.repositories import exercise_repo
from app.exercises.schemas.exercise_schemas import NewExercise

def get_exercises(q=None):
    return exercise_repo.get_exercises(q)

def new_exercise(exercise: NewExercise):
    return exercise_repo.new_exercise(
        exercise.name,
        exercise.primary_muscles,
        exercise.instructions
    )