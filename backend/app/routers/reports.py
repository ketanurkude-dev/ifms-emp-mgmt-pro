"""MIS-style summary reports. Approver-only reports aggregate across all
employees; "my-summary" is available to any logged-in employee for their
own records. Kept as simple status-count queries against the existing
tables -- no separate audit-log infrastructure needed for this."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_employee, require_approver
from app.database import get_db
from app.models import Certificate, Employee, EmployeeRequest, Grievance

router = APIRouter(prefix="/reports", tags=["reports"])


def _status_counts(db: Session, model, extra_filter=None) -> dict[str, int]:
    query = db.query(model).filter(model.is_deleted.is_(False))
    if extra_filter is not None:
        query = query.filter(extra_filter)
    counts: dict[str, int] = {}
    for row in query.all():
        counts[row.status] = counts.get(row.status, 0) + 1
    return counts


@router.get("/requests-pipeline")
def requests_pipeline(approver: Employee = Depends(require_approver), db: Session = Depends(get_db)):
    return _status_counts(db, EmployeeRequest)


@router.get("/certificates-pipeline")
def certificates_pipeline(approver: Employee = Depends(require_approver), db: Session = Depends(get_db)):
    return _status_counts(db, Certificate)


@router.get("/grievances-pipeline")
def grievances_pipeline(approver: Employee = Depends(require_approver), db: Session = Depends(get_db)):
    return _status_counts(db, Grievance)


@router.get("/my-summary")
def my_summary(employee: Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    return {
        "requests": _status_counts(db, EmployeeRequest, EmployeeRequest.employee_id == employee.id),
        "certificates": _status_counts(db, Certificate, Certificate.employee_id == employee.id),
        "grievances": _status_counts(db, Grievance, Grievance.employee_id == employee.id),
    }
