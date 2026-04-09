from datetime import datetime
from enum import Enum
from typing import Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String, Text, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker
from passlib.context import CryptContext

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


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    projects: Mapped[list["Project"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text)
    stage: Mapped[ProjectStage] = mapped_column(SQLEnum(ProjectStage), default=ProjectStage.IDEA)
    support_needed: Mapped[str] = mapped_column(String(120))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User] = relationship(back_populates="projects")
    updates: Mapped[list["ProjectUpdate"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    comments: Mapped[list["ProjectComment"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class ProjectUpdate(Base):
    __tablename__ = "project_updates"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    milestone: Mapped[str] = mapped_column(String(240))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped[Project] = relationship(back_populates="updates")


class ProjectComment(Base):
    __tablename__ = "project_comments"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    message: Mapped[str] = mapped_column(String(280))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped[Project] = relationship(back_populates="comments")


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


class CommentRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    message: str = Field(min_length=2, max_length=280)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: EmailStr


class ProjectUpdateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    milestone: str
    created_at: datetime


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
    updates: list[ProjectUpdateOut] = []
    comments: list[ProjectCommentOut] = []


class LoginOut(BaseModel):
    message: str
    user: UserOut


app = FastAPI(title="MzansiBuilds API", version="0.1.0")

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
