from app.exercises import repository as exercise_repo
from app.exercises.schemas import NewExercise

def get_exercises(q=None):
    return exercise_repo.get_exercises(q)

def new_exercise(exercise: NewExercise):
    return exercise_repo.new_exercise(
        exercise.name,
        exercise.primary_muscles,
        exercise.instructions
    )