from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models import Employee, EmployeeRequest
from app.schemas import RequestCreate, RequestOut

router = APIRouter(prefix="/requests", tags=["requests"])

# Simple entitlement ceilings, as a multiple of basic pay, per the SRS's
# "entitlement pre-check" requirement. Not a full rules engine -- just
# enough to demonstrate the check and refuse an over-limit amount.
ENTITLEMENT_MULTIPLIER = {
    "GPF advance": 3,
    "House building advance": 25,
    "Vehicle advance": 6,
    "Computer advance": 1,
    "Festival advance": 0.5,
}


@router.get("", response_model=list[RequestOut])
def list_my_requests(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(EmployeeRequest)
        .filter(EmployeeRequest.employee_id == employee.id, EmployeeRequest.is_deleted.is_(False))
        .order_by(EmployeeRequest.server_date.desc())
        .all()
    )


@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: RequestCreate,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    multiplier = ENTITLEMENT_MULTIPLIER.get(payload.request_type)
    if multiplier is not None and payload.amount:
        permissible = round(float(employee.basic_pay) * multiplier, 2)
        if payload.amount > permissible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Amount exceeds your permissible limit of Rs. {permissible} "
                    f"for {payload.request_type} ({multiplier}x basic pay)"
                ),
            )

    request = EmployeeRequest(
        employee_id=employee.id,
        request_type=payload.request_type,
        title=payload.title,
        description=payload.description,
        amount=payload.amount,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.post("/{request_id}/withdraw", response_model=RequestOut)
def withdraw_request(
    request_id: int,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    request = (
        db.query(EmployeeRequest)
        .filter(EmployeeRequest.id == request_id, EmployeeRequest.employee_id == employee.id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if request.status != "Submitted":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only a submitted request can be withdrawn")

    request.status = "Withdrawn"
    db.commit()
    db.refresh(request)
    return request
