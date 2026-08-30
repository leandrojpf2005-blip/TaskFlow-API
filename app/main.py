from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.macros.routers import macros
from app.users.routers import auth
from app.profile.routers import profile
from app.measurements.routers import measurements
from app.foods.routers import foods
from app.recipes.routers import recipes
from app.exercises.routers import exercises
from app.routines.routers import routines

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
