from fastapi.testclient import TestClient

import main
from main import Base, engine

client = TestClient(main.app)


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def create_user(username: str, email: str) -> dict:
    response = client.post(
        "/auth/register",
        json={"username": username, "email": email, "password": "StrongPass123"},
    )
    assert response.status_code == 201
    return response.json()


def test_register_and_login() -> None:
    create_user("nomfundo", "nomfundo@example.com")

    login_response = client.post(
        "/auth/login",
        json={"email": "nomfundo@example.com", "password": "StrongPass123"},
    )

    assert login_response.status_code == 200
    assert login_response.json()["message"] == "Login successful"


def test_create_project_requires_title() -> None:
    user = create_user("devone", "devone@example.com")

    bad_project = client.post(
        "/projects",
        json={
            "user_id": user["id"],
            "title": "",
            "description": "Building something amazing",
            "stage": "building",
            "support_needed": "testers",
        },
    )

    assert bad_project.status_code == 422


def test_complete_project_shows_in_celebration_wall() -> None:
    user = create_user("devtwo", "devtwo@example.com")

    project_response = client.post(
        "/projects",
        json={
            "user_id": user["id"],
            "title": "MzansiBuilds",
            "description": "Building in public platform",
            "stage": "building",
            "support_needed": "feedback",
        },
    )
    project_id = project_response.json()["id"]

    complete_response = client.post(f"/projects/{project_id}/complete")
    assert complete_response.status_code == 200
    assert complete_response.json()["stage"] == "completed"

    celebration = client.get("/celebration")
    assert celebration.status_code == 200
    assert len(celebration.json()) == 1


def test_team_collaboration_flow() -> None:
    owner = create_user("owner", "owner@example.com")
    member = create_user("member", "member@example.com")

    team_response = client.post(
        "/teams",
        json={
            "owner_id": owner["id"],
            "name": "Hackathon Heroes",
            "description": "Weekend sprint team",
            "team_type": "hackathon",
        },
    )
    assert team_response.status_code == 201
    team_id = team_response.json()["id"]
    assert team_response.json()["members"][0]["role"] == "admin"

    join_response = client.post(
        f"/teams/{team_id}/join",
        json={"user_id": member["id"], "role": "member"},
    )
    assert join_response.status_code == 201

    members_response = client.get(f"/teams/{team_id}/members")
    assert members_response.status_code == 200
    assert len(members_response.json()) == 2

    team_project_response = client.post(
        f"/teams/{team_id}/projects",
        json={
            "user_id": owner["id"],
            "title": "Team Kanban",
            "description": "Project board for collaboration",
            "stage": "building",
            "support_needed": "frontend help",
        },
    )
    assert team_project_response.status_code == 201
    project_id = team_project_response.json()["id"]

    update_response = client.post(
        f"/teams/{team_id}/projects/{project_id}/updates",
        json={"user_id": member["id"], "milestone": "Integrated notifications"},
    )
    assert update_response.status_code == 201
    assert update_response.json()["author"]["username"] == "member"

    team_projects_response = client.get(f"/teams/{team_id}/projects")
    assert team_projects_response.status_code == 200
    updates = team_projects_response.json()[0]["updates"]
    assert len(updates) == 1

    activity_response = client.get(f"/teams/{team_id}/activity")
    assert activity_response.status_code == 200
    assert len(activity_response.json()) >= 3
