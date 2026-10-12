# Integration tests for the workouts module — create → get → delete flow.
# Same pattern as test_routines.py (TestClient, register→login→CRUD), against the dev DB.
#
# Run from the project root:
#     ./venv/Scripts/python -m pytest tests/test_workouts.py -q

import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _auth_headers():
    suffix = uuid.uuid4().hex[:8]
    email = f"test_{suffix}@example.com"
    password = "testpass123"
    r = client.post("/auth/register", json={
        "username": f"tester_{suffix}", "email": email, "password": password,
    })
    assert r.status_code == 201, f"register failed: {r.status_code} {r.text}"
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _an_exercise_id(headers):
    r = client.get("/exercises", headers=headers)
    assert r.status_code == 200, f"get exercises failed: {r.status_code} {r.text}"
    exercises = r.json()
    assert len(exercises) > 0, "no exercises — did the import run?"
    return exercises[0]["id"]


def test_create_get_delete_workout():
    headers = _auth_headers()
    exercise_id = _an_exercise_id(headers)

    # --- CREATE (freestyle: no routine) ---
    r = client.post("/workouts", headers=headers, json={
        "routine_id": None,
        "duration": 3000,
        "sets": [
            {"exercise_id": exercise_id, "reps": 8, "weight": 80, "set_number": 1},
            {"exercise_id": exercise_id, "reps": 6, "weight": 85, "set_number": 2},
        ],
    })
    assert r.status_code == 200, f"create failed: {r.status_code} {r.text}"
    workout_id = r.json()["id"]

    # --- LIST ---
    r = client.get("/workouts", headers=headers)
    assert r.status_code == 200, f"list failed: {r.status_code} {r.text}"
    assert any(w["id"] == workout_id for w in r.json()), "created workout missing from list"

    # --- GET ONE (session + sets + volume) ---
    r = client.get(f"/workouts/{workout_id}", headers=headers)
    assert r.status_code == 200, f"get one failed: {r.status_code} {r.text}"
    body = r.json()
    assert len(body["sets"]) == 2, f"expected 2 sets, got {body.get('sets')}"
    assert body["volume"] == 8 * 80 + 6 * 85, f"volume wrong: expected 1150, got {body.get('volume')}"

    # --- DELETE ---
    r = client.delete(f"/workouts/{workout_id}", headers=headers)
    assert r.status_code == 200, f"delete failed: {r.status_code} {r.text}"

    # --- GET ONE again → 404 ---
    r = client.get(f"/workouts/{workout_id}", headers=headers)
    assert r.status_code == 404, f"expected 404 after delete, got {r.status_code}"


def test_get_missing_workout_404():
    headers = _auth_headers()
    r = client.get("/workouts/99999999", headers=headers)
    assert r.status_code == 404, f"expected 404 for missing workout, got {r.status_code}"
