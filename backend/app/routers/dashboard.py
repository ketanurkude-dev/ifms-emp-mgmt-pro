from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models import Employee
from app.schemas import EmployeeOut, LanguageUpdate

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/me", response_model=EmployeeOut)
def get_my_profile(employee: Employee = Depends(get_current_employee)):
    return employee


@router.put("/language", response_model=EmployeeOut)
def set_language(
    payload: LanguageUpdate,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    """The language choice is retained as a user preference for
    subsequent sessions, not just for the current browser."""
    if payload.language not in ("en", "hi"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Language must be 'en' or 'hi'")

    employee.preferred_language = payload.language
    db.commit()
    db.refresh(employee)
    return employee
