from fastapi import APIRouter, Depends

from app.auth import get_current_employee
from app.models import Employee
from app.schemas import EmployeeOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/me", response_model=EmployeeOut)
def get_my_profile(employee: Employee = Depends(get_current_employee)):
    return employee
