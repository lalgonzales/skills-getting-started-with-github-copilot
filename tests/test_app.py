from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    # make sure we disable caching so clients always see fresh data
    assert resp.headers.get("cache-control") == "no-store"
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate():
    # choose an activity and email
    activity = "Chess Club"
    email = "newstudent@mergington.edu"

    # ensure not already present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # signup success
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # duplicate should fail
    resp2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp2.status_code == 400
    assert resp2.json()["detail"] == "Student already signed up for this activity"


def test_unregister():
    activity = "Chess Club"
    email = "toremove@mergington.edu"

    # ensure present
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    resp = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]

    # deleting again should 404
    resp2 = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp2.status_code == 404
