from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.tasks.routers import tasks
from app.workspaces.routers import workspace

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(workspace.router)