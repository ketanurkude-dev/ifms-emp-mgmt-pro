from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_employee, require_approver
from app.database import get_db
from app.models import Employee, PensionCase
from app.schemas import PensionCaseOut

router = APIRouter(prefix="/pension", tags=["pension"])

STAGES = [
    "Forms received",
    "Establishment verification",
    "Service verification",
    "Pay verification",
    "Sanction",
    "PPO issued",
    "First payment authorised",
]


def _get_or_create_case(employee_id: int, db: Session) -> PensionCase:
    case = db.query(PensionCase).filter(PensionCase.employee_id == employee_id).first()
    if not case:
        case = PensionCase(employee_id=employee_id)
        db.add(case)
        db.commit()
        db.refresh(case)
    return case


@router.get("/case", response_model=PensionCaseOut)
def get_my_case(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return _get_or_create_case(employee.id, db)


@router.post("/case/advance", response_model=PensionCaseOut)
def advance_stage(
    employee_id: int,
    approver: Employee = Depends(require_approver),
    db: Session = Depends(get_db),
):
    case = _get_or_create_case(employee_id, db)
    current_index = STAGES.index(case.stage) if case.stage in STAGES else 0
    if current_index < len(STAGES) - 1:
        case.stage = STAGES[current_index + 1]
        case.forms_completion_percent = round((current_index + 2) / len(STAGES) * 100)
        db.commit()
        db.refresh(case)
    return case
