from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_employee, require_approver
from app.database import get_db
from app.events import log_action
from app.models import Employee, Grievance
from app.schemas import GrievanceCreate, GrievanceOut, GrievanceRating, GrievanceReply

router = APIRouter(prefix="/grievances", tags=["grievances"])

REOPEN_WINDOW_DAYS = 30


@router.get("", response_model=list[GrievanceOut])
def list_my_grievances(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(Grievance)
        .filter(Grievance.employee_id == employee.id, Grievance.is_deleted.is_(False))
        .order_by(Grievance.server_date.desc())
        .all()
    )


@router.post("", response_model=GrievanceOut, status_code=status.HTTP_201_CREATED)
def lodge_grievance(
    payload: GrievanceCreate,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    grievance = Grievance(
        employee_id=employee.id,
        category=payload.category,
        subject=payload.subject,
        description=payload.description,
    )
    db.add(grievance)
    db.commit()
    db.refresh(grievance)
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=employee.role, action="Grievance lodged", entity_type="Grievance", entity_id=grievance.id, after_value=payload.category)
    db.commit()
    return grievance


@router.post("/{grievance_id}/rate", response_model=GrievanceOut)
def rate_grievance(
    grievance_id: int,
    payload: GrievanceRating,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    grievance = (
        db.query(Grievance)
        .filter(Grievance.id == grievance_id, Grievance.employee_id == employee.id)
        .first()
    )
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    if grievance.status != "Closed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only a closed grievance can be rated")

    grievance.rating = payload.rating
    db.commit()
    db.refresh(grievance)
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=employee.role, action="Grievance rated", entity_type="Grievance", entity_id=grievance.id, after_value=str(payload.rating))
    db.commit()
    return grievance


@router.post("/{grievance_id}/reopen", response_model=GrievanceOut)
def reopen_grievance(
    grievance_id: int,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    grievance = (
        db.query(Grievance)
        .filter(Grievance.id == grievance_id, Grievance.employee_id == employee.id)
        .first()
    )
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    if grievance.status != "Closed" or not grievance.closed_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only a closed grievance can be reopened")
    if datetime.utcnow() - grievance.closed_at > timedelta(days=REOPEN_WINDOW_DAYS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reopen window of {REOPEN_WINDOW_DAYS} days has passed",
        )

    grievance.status = "Submitted"
    grievance.closed_at = None
    grievance.reply = None
    db.commit()
    db.refresh(grievance)
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=employee.role, action="Grievance reopened", entity_type="Grievance", entity_id=grievance.id)
    db.commit()
    return grievance


# --- Approver-only endpoints ---


@router.get("/queue", response_model=list[GrievanceOut])
def get_grievance_queue(
    approver: Employee = Depends(require_approver),
    db: Session = Depends(get_db),
):
    return (
        db.query(Grievance)
        .filter(Grievance.status == "Submitted", Grievance.is_deleted.is_(False))
        .order_by(Grievance.server_date)
        .all()
    )


@router.post("/{grievance_id}/reply", response_model=GrievanceOut)
def reply_to_grievance(
    grievance_id: int,
    payload: GrievanceReply,
    approver: Employee = Depends(require_approver),
    db: Session = Depends(get_db),
):
    grievance = db.query(Grievance).filter(Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")

    grievance.reply = payload.reply
    grievance.status = payload.status
    grievance.reviewed_by = approver.id
    if payload.status == "Closed":
        grievance.closed_at = datetime.utcnow()

    db.commit()
    db.refresh(grievance)
    log_action(db, employee_id=grievance.employee_id, actor_id=approver.id, actor_role=approver.role, action=f"Grievance {payload.status.lower()}", entity_type="Grievance", entity_id=grievance.id, after_value=payload.status, details=payload.reply)
    db.commit()
    return grievance
