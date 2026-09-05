from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import Faq
from app.routers import (
    approver,
    audit,
    auth,
    certificates,
    circulars,
    dashboard,
    faq,
    gpf,
    grievances,
    pension,
    profile,
    reports,
    requests,
    salary,
    tax,
)
from app.seed import build_faqs

# Creates tables on startup if they don't exist yet (simple approach, no migrations tool).
Base.metadata.create_all(bind=engine)

# Seed FAQ content once, if the table is empty.
with SessionLocal() as db:
    if db.query(Faq).count() == 0:
        db.add_all(build_faqs())
        db.commit()

app = FastAPI(title="Employee Portal API")

app.add_middleware(
    CORSMiddleware,
    # "null" is the Origin a browser sends for file:// pages -- the plain
    # landing/index.html uses that to call the public certificate
    # verification endpoint directly, with no login.
    allow_origins=[settings.frontend_origin, "null"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(profile.router)
app.include_router(salary.router)
app.include_router(requests.router)
app.include_router(approver.router)
app.include_router(gpf.router)
app.include_router(certificates.router)
app.include_router(circulars.router)
app.include_router(grievances.router)
app.include_router(tax.router)
app.include_router(pension.router)
app.include_router(faq.router)
app.include_router(reports.router)
app.include_router(audit.router)


@app.get("/")
def root():
    return {"status": "ok"}
