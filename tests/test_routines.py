# Integration tests for the routines module — the create → get → delete flow.
#
# Uses FastAPI's TestClient, which runs the whole stack (router → service →
# repo → DB) in-process. Runs against your DEV DB (localhost:5432), registering
# a throwaway user with a random email each run so re-runs don't collide.
#
# Run from the project root:
#     ./venv/Scripts/python -m pytest tests/test_routines.py -q
#
# This is the TestClient pattern you'll REUSE for the workout endpoints.

import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _auth_headers():
    """Register a fresh user, log in, return the Bearer auth header."""
    suffix = uuid.uuid4().hex[:8]
    email = f"test_{suffix}@example.com"
    password = "testpass123"

    r = client.post("/auth/register", json={
        "username": f"tester_{suffix}",
        "email": email,
        "password": password,
    })
    assert r.status_code == 201, f"register failed: {r.status_code} {r.text}"

    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _an_exercise_id(headers):
    """Grab a real exercise id from the catalog (routines need a valid FK)."""
    r = client.get("/exercises", headers=headers)
    assert r.status_code == 200, f"get exercises failed: {r.status_code} {r.text}"
    exercises = r.json()
    assert len(exercises) > 0, "no exercises in the catalog — did the import run?"
    return exercises[0]["id"]


def test_create_get_delete_routine():
    headers = _auth_headers()
    exercise_id = _an_exercise_id(headers)

    # --- CREATE ---
    r = client.post("/routines", headers=headers, json={
        "name": "Test Push Day",
        "items": [{"exercise_id": exercise_id, "sets": 3}],
    })
    assert r.status_code == 200, f"create failed: {r.status_code} {r.text}"
    routine_id = r.json()["id"]

    # --- LIST (the new routine should be in it) ---
    r = client.get("/routines", headers=headers)
    assert r.status_code == 200, f"list failed: {r.status_code} {r.text}"
    assert any(rt["id"] == routine_id for rt in r.json()), "created routine missing from list"

    # --- GET ONE (returns its exercises) ---
    r = client.get(f"/routines/{routine_id}", headers=headers)
    assert r.status_code == 200, f"get one failed: {r.status_code} {r.text}"
    assert len(r.json()) >= 1, "routine has no exercises"

    # --- DELETE ---
    r = client.delete(f"/routines/{routine_id}", headers=headers)
    assert r.status_code == 200, f"delete failed: {r.status_code} {r.text}"

    # --- GET ONE again → should now be 404 (deleted) ---
    r = client.get(f"/routines/{routine_id}", headers=headers)
    assert r.status_code == 404, f"expected 404 after delete, got {r.status_code}"


def test_get_missing_routine_404():
    headers = _auth_headers()
    r = client.get("/routines/99999999", headers=headers)
    assert r.status_code == 404, f"expected 404 for missing routine, got {r.status_code}"
