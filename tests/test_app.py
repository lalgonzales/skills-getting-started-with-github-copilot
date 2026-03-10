from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

def test_root_redirect():
    resp = client.get("/")
    # TestClient follows the redirect, so we see the final page instead of 307
    assert resp.status_code == 200
    assert "text/html" in resp.headers.get("content-type", "")

def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert "Chess Club" in data

def test_signup_flow():
    email = "teststudent@mergington.edu"
    activity = "Chess Club"

    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 400

    activities[activity]["participants"].remove(email)

def test_signup_nonexistent():
    resp = client.post("/activities/Nonexistent/signup", params={"email": "a@b.com"})
    assert resp.status_code == 404

def test_remove_flow():
    email = "removeme@mergington.edu"
    activity = "Programming Class"
    activities[activity]["participants"].append(email)

    resp = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]

    resp = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 404

def test_remove_nonexistent_activity():
    resp = client.delete("/activities/Nope/signup", params={"email": "a@b.com"})
    assert resp.status_code == 404

