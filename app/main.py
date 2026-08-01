from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.macros.routers import macros
from app.users.routers import auth
from app.profile.routers import profile
from app.measurements.routers import measurements

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(macros.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(measurements.router)
