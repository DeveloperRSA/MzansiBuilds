from datetime import datetime
from enum import Enum

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    create_engine,
    select,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

# Local SQLite keeps setup simple for challenge submissions.
DATABASE_URL = "sqlite:///./mzansibuilds.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Base(DeclarativeBase):
    pass


class ProjectStage(str, Enum):
    IDEA = "idea"
    BUILDING = "building"
    TESTING = "testing"
    DEPLOYED = "deployed"
    COMPLETED = "completed"


# Role enum is intentionally small now, but ready for stricter RBAC checks later.
class TeamRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"


class TeamType(str, Enum):
    HACKATHON = "hackathon"
    STUDENT_GROUP = "student_group"
    STARTUP = "startup"
    GENERAL = "general"


class ActivityType(str, Enum):
    TEAM_CREATED = "team_created"
    MEMBER_JOINED = "member_joined"
    PROJECT_CREATED = "project_created"
    PROJECT_UPDATED = "project_updated"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    projects: Mapped[list["Project"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    team_memberships: Mapped[list["TeamMembership"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(400), default="")
    team_type: Mapped[TeamType] = mapped_column(SQLEnum(TeamType), default=TeamType.GENERAL)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User] = relationship()
    members: Mapped[list["TeamMembership"]] = relationship(back_populates="team", cascade="all, delete-orphan")
    projects: Mapped[list["Project"]] = relationship(back_populates="team")
    activity_logs: Mapped[list["TeamActivity"]] = relationship(back_populates="team", cascade="all, delete-orphan")


class TeamMembership(Base):
    __tablename__ = "team_memberships"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="unique_team_member"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[TeamRole] = mapped_column(SQLEnum(TeamRole), default=TeamRole.MEMBER)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped[Team] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="team_memberships")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text)
    stage: Mapped[ProjectStage] = mapped_column(SQLEnum(ProjectStage), default=ProjectStage.IDEA)
    support_needed: Mapped[str] = mapped_column(String(120))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User] = relationship(back_populates="projects")
    team: Mapped[Team | None] = relationship(back_populates="projects")
    updates: Mapped[list["ProjectUpdate"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    comments: Mapped[list["ProjectComment"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class ProjectUpdate(Base):
    __tablename__ = "project_updates"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    milestone: Mapped[str] = mapped_column(String(240))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped[Project] = relationship(back_populates="updates")
    author: Mapped[User | None] = relationship()


class ProjectComment(Base):
    __tablename__ = "project_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    message: Mapped[str] = mapped_column(String(280))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped[Project] = relationship(back_populates="comments")


# Activity table tracks collaboration events for future analytics/auditing features.
class TeamActivity(Base):
    __tablename__ = "team_activity"

    id: Mapped[int] = mapped_column(primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    activity_type: Mapped[ActivityType] = mapped_column(SQLEnum(ActivityType))
    detail: Mapped[str] = mapped_column(String(280))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped[Team] = relationship(back_populates="activity_logs")
    user: Mapped[User | None] = relationship()


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class ProjectCreateRequest(BaseModel):
    user_id: int
    title: str = Field(min_length=2, max_length=140)
    description: str = Field(min_length=5, max_length=1000)
    stage: ProjectStage
    support_needed: str = Field(min_length=2, max_length=120)


class MilestoneRequest(BaseModel):
    milestone: str = Field(min_length=2, max_length=240)


class TeamMilestoneRequest(BaseModel):
    user_id: int
    milestone: str = Field(min_length=2, max_length=240)


class CommentRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    message: str = Field(min_length=2, max_length=280)


class TeamCreateRequest(BaseModel):
    owner_id: int
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=400)
    team_type: TeamType = TeamType.GENERAL


class TeamJoinRequest(BaseModel):
    user_id: int
    role: TeamRole = TeamRole.MEMBER


class TeamProjectCreateRequest(BaseModel):
    user_id: int
    title: str = Field(min_length=2, max_length=140)
    description: str = Field(min_length=5, max_length=1000)
    stage: ProjectStage
    support_needed: str = Field(min_length=2, max_length=120)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr


class TeamMembershipOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: TeamRole
    joined_at: datetime
    user: UserOut


class ProjectUpdateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    milestone: str
    created_at: datetime
    author: UserOut | None = None


class ProjectCommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    message: str
    created_at: datetime


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    stage: ProjectStage
    support_needed: str
    created_at: datetime
    owner: UserOut
    team_id: int | None = None
    updates: list[ProjectUpdateOut] = []
    comments: list[ProjectCommentOut] = []


class TeamOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    team_type: TeamType
    owner_id: int
    created_at: datetime


class TeamDetailOut(TeamOut):
    members: list[TeamMembershipOut] = []


class TeamActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activity_type: ActivityType
    detail: str
    created_at: datetime
    user: UserOut | None = None


class LoginOut(BaseModel):
    message: str
    user: UserOut


app = FastAPI(title="MzansiBuilds API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_team_or_404(db: Session, team_id: int) -> Team:
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    return team


def get_team_membership(db: Session, team_id: int, user_id: int) -> TeamMembership | None:
    return db.scalar(select(TeamMembership).where(TeamMembership.team_id == team_id, TeamMembership.user_id == user_id))


def ensure_team_member(db: Session, team_id: int, user_id: int) -> TeamMembership:
    membership = get_team_membership(db, team_id, user_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a team member")
    return membership


def log_team_activity(db: Session, team_id: int, activity_type: ActivityType, detail: str, user_id: int | None = None) -> None:
    db.add(
        TeamActivity(
            team_id=team_id,
            user_id=user_id,
            activity_type=activity_type,
            detail=detail,
        )
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
    existing = db.scalar(select(User).where((User.email == payload.email) | (User.username == payload.username)))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=pwd_context.hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=LoginOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginOut:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return LoginOut(message="Login successful", user=user)


@app.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreateRequest, db: Session = Depends(get_db)) -> Project:
    owner = get_user_or_404(db, payload.user_id)

    project = Project(
        title=payload.title,
        description=payload.description,
        stage=payload.stage,
        support_needed=payload.support_needed,
        owner_id=owner.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@app.get("/feed", response_model=list[ProjectOut])
def feed(db: Session = Depends(get_db)) -> list[Project]:
    return list(db.scalars(select(Project).order_by(Project.created_at.desc())).all())


@app.post("/projects/{project_id}/updates", response_model=ProjectUpdateOut, status_code=status.HTTP_201_CREATED)
def add_update(project_id: int, payload: MilestoneRequest, db: Session = Depends(get_db)) -> ProjectUpdate:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update = ProjectUpdate(project_id=project_id, milestone=payload.milestone)
    db.add(update)

    if project.team_id:
        log_team_activity(db, project.team_id, ActivityType.PROJECT_UPDATED, f"Project '{project.title}' updated")

    db.commit()
    db.refresh(update)
    return update


@app.post("/projects/{project_id}/comments", response_model=ProjectCommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(project_id: int, payload: CommentRequest, db: Session = Depends(get_db)) -> ProjectComment:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    comment = ProjectComment(project_id=project_id, name=payload.name, message=payload.message)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@app.post("/projects/{project_id}/complete", response_model=ProjectOut)
def mark_completed(project_id: int, db: Session = Depends(get_db)) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project.stage = ProjectStage.COMPLETED
    db.commit()
    db.refresh(project)
    return project


@app.get("/celebration", response_model=list[ProjectOut])
def celebration_wall(db: Session = Depends(get_db)) -> list[Project]:
    return list(db.scalars(select(Project).where(Project.stage == ProjectStage.COMPLETED)).all())


# Team creation automatically registers the owner as admin member.
@app.post("/teams", response_model=TeamDetailOut, status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreateRequest, db: Session = Depends(get_db)) -> Team:
    owner = get_user_or_404(db, payload.owner_id)

    existing_team = db.scalar(select(Team).where(Team.name == payload.name))
    if existing_team:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team name already exists")

    team = Team(name=payload.name, description=payload.description, team_type=payload.team_type, owner_id=owner.id)
    db.add(team)
    db.flush()

    owner_membership = TeamMembership(team_id=team.id, user_id=owner.id, role=TeamRole.ADMIN)
    db.add(owner_membership)
    log_team_activity(db, team.id, ActivityType.TEAM_CREATED, f"Team '{team.name}' created", owner.id)

    db.commit()
    db.refresh(team)
    return team


@app.get("/teams", response_model=list[TeamOut])
def list_teams(db: Session = Depends(get_db)) -> list[Team]:
    return list(db.scalars(select(Team).order_by(Team.created_at.desc())).all())


@app.post("/teams/{team_id}/join", response_model=TeamMembershipOut, status_code=status.HTTP_201_CREATED)
def join_team(team_id: int, payload: TeamJoinRequest, db: Session = Depends(get_db)) -> TeamMembership:
    team = get_team_or_404(db, team_id)
    user = get_user_or_404(db, payload.user_id)

    existing = get_team_membership(db, team_id, user.id)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already in team")

    membership = TeamMembership(team_id=team.id, user_id=user.id, role=payload.role)
    db.add(membership)
    log_team_activity(db, team.id, ActivityType.MEMBER_JOINED, f"{user.username} joined as {payload.role.value}", user.id)
    db.commit()
    db.refresh(membership)
    return membership


@app.get("/teams/{team_id}", response_model=TeamDetailOut)
def get_team(team_id: int, db: Session = Depends(get_db)) -> Team:
    return get_team_or_404(db, team_id)


@app.get("/teams/{team_id}/members", response_model=list[TeamMembershipOut])
def list_team_members(team_id: int, db: Session = Depends(get_db)) -> list[TeamMembership]:
    get_team_or_404(db, team_id)
    return list(db.scalars(select(TeamMembership).where(TeamMembership.team_id == team_id)).all())


# Team projects are shared by membership; any member can create one.
@app.post("/teams/{team_id}/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_team_project(team_id: int, payload: TeamProjectCreateRequest, db: Session = Depends(get_db)) -> Project:
    team = get_team_or_404(db, team_id)
    user = get_user_or_404(db, payload.user_id)
    ensure_team_member(db, team.id, user.id)

    project = Project(
        title=payload.title,
        description=payload.description,
        stage=payload.stage,
        support_needed=payload.support_needed,
        owner_id=user.id,
        team_id=team.id,
    )
    db.add(project)
    log_team_activity(db, team.id, ActivityType.PROJECT_CREATED, f"{user.username} created project '{project.title}'", user.id)
    db.commit()
    db.refresh(project)
    return project


@app.get("/teams/{team_id}/projects", response_model=list[ProjectOut])
def list_team_projects(team_id: int, db: Session = Depends(get_db)) -> list[Project]:
    get_team_or_404(db, team_id)
    return list(db.scalars(select(Project).where(Project.team_id == team_id).order_by(Project.created_at.desc())).all())


@app.post("/teams/{team_id}/projects/{project_id}/updates", response_model=ProjectUpdateOut, status_code=status.HTTP_201_CREATED)
def add_team_project_update(
    team_id: int,
    project_id: int,
    payload: TeamMilestoneRequest,
    db: Session = Depends(get_db),
) -> ProjectUpdate:
    get_team_or_404(db, team_id)
    user = get_user_or_404(db, payload.user_id)
    ensure_team_member(db, team_id, user.id)

    project = db.get(Project, project_id)
    if not project or project.team_id != team_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team project not found")

    update = ProjectUpdate(project_id=project_id, milestone=payload.milestone, author_id=user.id)
    db.add(update)
    log_team_activity(db, team_id, ActivityType.PROJECT_UPDATED, f"{user.username} updated '{project.title}'", user.id)
    db.commit()
    db.refresh(update)
    return update


@app.get("/teams/{team_id}/activity", response_model=list[TeamActivityOut])
def list_team_activity(team_id: int, db: Session = Depends(get_db)) -> list[TeamActivity]:
    get_team_or_404(db, team_id)
    return list(db.scalars(select(TeamActivity).where(TeamActivity.team_id == team_id).order_by(TeamActivity.created_at.desc())).all())
