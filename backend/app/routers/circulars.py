from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_employee, require_approver
from app.database import get_db
from app.events import log_action
from app.models import Circular, CircularAcknowledgement, Employee
from app.schemas import CircularCreate, CircularOut

router = APIRouter(prefix="/circulars", tags=["circulars"])


@router.get("", response_model=list[CircularOut])
def list_circulars(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    circulars = (
        db.query(Circular)
        .filter(Circular.is_deleted.is_(False))
        .order_by(Circular.published_on.desc())
        .all()
    )
    acknowledged_ids = {
        ack.circular_id
        for ack in db.query(CircularAcknowledgement)
        .filter(CircularAcknowledgement.employee_id == employee.id)
        .all()
    }

    result = []
    for circular in circulars:
        out = CircularOut.model_validate(circular)
        out.acknowledged = circular.id in acknowledged_ids
        result.append(out)
    return result


@router.post("", response_model=CircularOut, status_code=status.HTTP_201_CREATED)
def create_circular(
    payload: CircularCreate,
    approver: Employee = Depends(require_approver),
    db: Session = Depends(get_db),
):
    circular = Circular(
        title=payload.title,
        category=payload.category,
        issuing_office=payload.issuing_office,
        content=payload.content,
        requires_ack=payload.requires_ack,
        published_on=date.today(),
        created_by=approver.id,
    )
    db.add(circular)
    db.commit()
    db.refresh(circular)
    log_action(db, employee_id=None, actor_id=approver.id, actor_role=approver.role, action="Circular published", entity_type="Circular", entity_id=circular.id, after_value=payload.title)
    db.commit()
    return circular


@router.post("/{circular_id}/acknowledge")
def acknowledge_circular(
    circular_id: int,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Circular not found")

    existing = (
        db.query(CircularAcknowledgement)
        .filter(CircularAcknowledgement.circular_id == circular_id, CircularAcknowledgement.employee_id == employee.id)
        .first()
    )
    if existing:
        return {"message": "Already acknowledged"}

    db.add(CircularAcknowledgement(circular_id=circular_id, employee_id=employee.id))
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=employee.role, action="Circular acknowledged", entity_type="Circular", entity_id=circular_id)
    db.commit()
    return {"message": "Acknowledged"}
