# MzansiBuilds
MzansiBuilds is a platform that enables developers to build in public by sharing their projects, tracking progress through milestones, and collaborating with other developers.

### Problem solved
Many developers build in isolation and miss support, accountability, and exposure. MzansiBuilds makes project progress visible and collaboration-friendly. This is the "TryHachMe" platform for developers :)

### Target users
- Student developers
- Junior developers building portfolios
- Professional/Senior developers building side projects in public

### Core features
- Account registration and login
- Project creation with stage and support needed
- Live feed of developer projects
- Milestone updates and comments for collaboration
- Celebration wall for completed projects

## Stack

- **Frontend:** React + Vite + CSS (green/white/black design theme)
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Security:** Password hashing with bcrypt (passlib)
- **Testing:** pytest + FastAPI TestClient

## Extra Features:
## Team Collaboration Support

MzansiBuilds now supports the ability for users to create or join teams, making it easier to collaborate on projects. A team can consist of multiple members, allowing developers, students, or hackathon groups to work together within a shared workspace(note that the celebration wall for is separate for teams and users to ensure fairness).

## Each team includes:

-a team owner (admin)
-multiple team members
-shared access to projects and updates

## This feature makes the platform suitable for:

-hackathon teams
-student group projects
-teams from different companies
-startup teams
-collaborative software development

The team structure is designed to scale, with future enhancements such as role-based permissions, activity tracking, and shared project dashboards.

## Repository structure

```text
backend/
  main.py
  requirements.txt
  tests/test_api.py
frontend/
  index.html
  package.json
  src/
    App.jsx
    main.jsx
    api.js
    styles.css
    components/ProjectCard.jsx
```

## Run locally

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs: `http://127.0.0.1:8000/docs`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`

## Competency evidence mapping

### 1. Project Profiling 
Included in this README (problem, users, scope, features).

### 2. Code Version Control 
Use granular commits, e.g.:
- `feat(api): add register/login endpoints`
- `feat(feed): add project feed and celebration wall`
- `test(api): add registration and project tests`

### 3. Test-Driven Development 
`backend/tests/test_api.py` includes tests for:
- user register + login success
- project creation validation
- celebration wall flow after completion

### 4. Secure by Design 
- Passwords are hashed with bcrypt
- Email/password inputs are validated with Pydantic
- Basic constraints and length checks are enforced
- Keep sensitive values in `.env` when extending auth/session features

### 5. Project Documentation  
This README includes overview, architecture, run instructions, and competency mapping.

### 6. Ethical Use of AI 
This project was fully driven by DeveloperRSA(me) original vision, from the initial brainstorming and functional requirements to the final technology choices. I integrated AI-assisted coding to streamline the development process, refine the codebase and code review support(GitHub Copilot included). All generated output was reviewed, edited, and validated by DeveloperRSA before final submission.

## Future improvements

- JWT auth and user sessions
- Real-time feed via WebSockets
- Pagination and filtering by stage
- Notification system for collaboration requests
- CI workflow for tests and linting
