from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models import Employee, EmployeeRequest
from app.schemas import EmployeeOut, ProfileUpdateRequest, RequestCreate, RequestOut

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=EmployeeOut)
def get_my_profile(employee: Employee = Depends(get_current_employee)):
    return employee


@router.put("/me", response_model=EmployeeOut)
def update_my_profile(
    payload: ProfileUpdateRequest,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    # Contact details (email, mobile) can be changed directly.
    employee.email = payload.email
    employee.mobile = payload.mobile
    db.commit()
    db.refresh(employee)
    return employee


@router.post("/change-requests", response_model=RequestOut, status_code=201)
def raise_change_request(
    payload: RequestCreate,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    # Fields other than email/mobile (name, designation, office, etc.) go
    # through a request instead of a direct edit, since they need approval.
    request = EmployeeRequest(
        employee_id=employee.id,
        request_type="profile_change",
        title=payload.title,
        description=payload.description,
        amount=None,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("/change-requests", response_model=list[RequestOut])
def list_change_requests(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(EmployeeRequest)
        .filter(
            EmployeeRequest.employee_id == employee.id,
            EmployeeRequest.request_type == "profile_change",
            EmployeeRequest.is_deleted.is_(False),
        )
        .order_by(EmployeeRequest.server_date.desc())
        .all()
    )
