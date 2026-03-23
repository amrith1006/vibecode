import os
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select

class Job(SQLModel, table=True):
    __tablename__ = "job_render"
    id: int | None = Field(default=None, primary_key=True)
    title: str
    company_name: str
    description: str
    location: str

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:admin123@localhost:3306/vibecode")

engine = create_engine(DATABASE_URL, echo=False)

def create_db_and_tables():
    try:
        SQLModel.metadata.create_all(engine)
    except Exception as e:
        print(f"Warning: Could not connect to MySQL. Error: {e}")

app = FastAPI(title="Vibecode.ai Technologies Job Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

@app.get("/api/jobs", response_model=list[Job])
def get_jobs(session: SessionDep):
    jobs = session.exec(select(Job)).all()
    return jobs

@app.post("/api/job/post", response_model=Job)
def create_job(job: Job, session: SessionDep):
    session.add(job)
    session.commit()
    session.refresh(job)
    return job

@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, session: SessionDep):
    job = session.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    session.delete(job)
    session.commit()
    return {"ok": True}

# Local Static File Serving
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@app.get("/")
@app.get("/index.html")
def serve_index():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/jobs.html")
def serve_jobs_html():
    return FileResponse(os.path.join(BASE_DIR, "jobs.html"))

@app.get("/post-job.html")
def serve_post_job():
    return FileResponse(os.path.join(BASE_DIR, "post-job.html"))

@app.get("/style.css")
def serve_css():
    return FileResponse(os.path.join(BASE_DIR, "style.css"))

@app.get("/app.js")
def serve_js():
    return FileResponse(os.path.join(BASE_DIR, "app.js"))

@app.get("/hero-image.png")
def serve_hero_image():
    return FileResponse(os.path.join(BASE_DIR, "hero-image.png"))
