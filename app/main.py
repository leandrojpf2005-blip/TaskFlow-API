from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.macros import router as macros
from app.users import router as auth
from app.profile import router as profile
from app.measurements import router as measurements
from app.foods import router as foods
from app.recipes import router as recipes
from app.exercises import router as exercises
from app.routines import router as routines
from app.workouts import router as workouts

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(macros.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(measurements.router)
app.include_router(foods.router)
app.include_router(recipes.router)
app.include_router(exercises.router)
app.include_router(routines.router)
app.include_router(workouts.router)
