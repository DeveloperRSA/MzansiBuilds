from fastapi.testclient import TestClient

import main
from main import Base, SessionLocal, engine

client = TestClient(main.app)


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_register_and_login() -> None:
    register_response = client.post(
        "/auth/register",
        json={"username": "nomfundo", "email": "nomfundo@example.com", "password": "StrongPass123"},
    )

    assert register_response.status_code == 201
    assert register_response.json()["email"] == "nomfundo@example.com"

    login_response = client.post(
        "/auth/login",
        json={"email": "nomfundo@example.com", "password": "StrongPass123"},
    )

    assert login_response.status_code == 200
    assert login_response.json()["message"] == "Login successful"


def test_create_project_requires_title() -> None:
    register_response = client.post(
        "/auth/register",
        json={"username": "devone", "email": "devone@example.com", "password": "StrongPass123"},
    )
    user_id = register_response.json()["id"]

    bad_project = client.post(
        "/projects",
        json={
            "user_id": user_id,
            "title": "",
            "description": "Building something amazing",
            "stage": "building",
            "support_needed": "testers",
        },
    )

    assert bad_project.status_code == 422


def test_complete_project_shows_in_celebration_wall() -> None:
    register_response = client.post(
        "/auth/register",
        json={"username": "devtwo", "email": "devtwo@example.com", "password": "StrongPass123"},
    )
    user_id = register_response.json()["id"]

    project_response = client.post(
        "/projects",
        json={
            "user_id": user_id,
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
