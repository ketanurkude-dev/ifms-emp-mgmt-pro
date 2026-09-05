from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import require_approver
from app.database import get_db
from app.events import log_action
from app.models import Certificate, Employee, EmployeeRequest
from app.schemas import ApproverQueueItem, ReviewRequest

router = APIRouter(prefix="/approver", tags=["approver"])

# Maps the "kind" used by the frontend to its model, so one generic review
# endpoint can approve/reject/return either. Grievances are handled
# separately (reply-and-close, not approve/reject) in routers/grievances.py.
KIND_MODELS = {
    "request": EmployeeRequest,
    "certificate": Certificate,
}


@router.get("/queue", response_model=list[ApproverQueueItem])
def get_queue(
    approver: Employee = Depends(require_approver),
    db: Session = Depends(get_db),
):
    items = []

    for req in (
        db.query(EmployeeRequest)
        .filter(EmployeeRequest.status == "Submitted", EmployeeRequest.is_deleted.is_(False))
        .all()
    ):
        employee = db.query(Employee).get(req.employee_id)
        items.append(
            ApproverQueueItem(
                kind="request",
                id=req.id,
                employee_id=req.employee_id,
                employee_name=employee.name if employee else "Unknown",
                employee_designation=employee.designation if employee else None,
                employee_office=employee.office if employee else None,
                title=f"{req.request_type}: {req.title}",
                description=req.description,
                amount=float(req.amount) if req.amount is not None else None,
                status=req.status,
                server_date=req.server_date,
            )
        )

    for cert in (
        db.query(Certificate)
        .filter(Certificate.status == "Submitted", Certificate.is_deleted.is_(False))
        .all()
    ):
        employee = db.query(Employee).get(cert.employee_id)
        items.append(
            ApproverQueueItem(
                kind="certificate",
                id=cert.id,
                employee_id=cert.employee_id,
                employee_name=employee.name if employee else "Unknown",
                employee_designation=employee.designation if employee else None,
                employee_office=employee.office if employee else None,
                title=f"Certificate: {cert.certificate_type}",
                description=cert.purpose,
                status=cert.status,
                server_date=cert.server_date,
            )
        )

    items.sort(key=lambda item: item.server_date)
    return items


@router.post("/{kind}/{item_id}/review")
def review_item(
    kind: str,
    item_id: int,
    payload: ReviewRequest,
    approver: Employee = Depends(require_approver),
    db: Session = Depends(get_db),
):
    model = KIND_MODELS.get(kind)
    if not model:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown item kind")
    if payload.status not in ("Approved", "Rejected", "Returned"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    item = db.query(model).filter(model.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    if payload.status == "Returned" and not payload.review_remarks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Remarks are required to return an item")

    item.status = payload.status
    item.reviewed_by = approver.id
    if hasattr(item, "review_remarks"):
        item.review_remarks = payload.review_remarks
    if hasattr(item, "reviewed_at"):
        item.reviewed_at = datetime.utcnow()

    if kind == "certificate" and payload.status == "Approved":
        item.certificate_number = f"CERT/{datetime.utcnow().year}/{item.id:06d}"
        item.issued_on = datetime.utcnow().date()

    db.commit()
    log_action(
        db, employee_id=item.employee_id, actor_id=approver.id, actor_role=approver.role, action=f"{kind.capitalize()} {payload.status.lower()}",
        entity_type=model.__name__, entity_id=item.id, before_value="Submitted", after_value=payload.status, details=payload.review_remarks,
    )
    db.commit()
    return {"message": f"{kind.capitalize()} {payload.status.lower()}"}
