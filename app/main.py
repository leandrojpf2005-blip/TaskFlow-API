from fastapi import FastAPI

app = FastAPI()

db = [
    {'id': 1, 'title': 'Learn FastAPI'},
    {'id': 2, 'title': 'Make my first API'},
    {'id': 3, 'title': 'Get a job'},
]

@app.get("/")
def home():
    return {'message': 'TaskFlow API is running'}

@app.get("/tasks")
def tasks():
    return db

@app.post("/tasks")
def create_task(task: dict):
    new_id = len(db) + 1
    new_task = {
        "id": new_id,
        "title": task["title"]
    }
    db.append(new_task)
    return new_task
