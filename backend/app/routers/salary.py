from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models import Employee, SalarySlip
from app.pdf import build_salary_slip_pdf
from app.schemas import SalarySlipOut

router = APIRouter(prefix="/salary", tags=["salary"])


@router.get("/slips", response_model=list[SalarySlipOut])
def list_salary_slips(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(SalarySlip)
        .filter(SalarySlip.employee_id == employee.id, SalarySlip.is_deleted.is_(False))
        .order_by(SalarySlip.month.desc())
        .all()
    )


@router.get("/slips/{slip_id}/pdf")
def download_salary_slip_pdf(
    slip_id: int,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    slip = (
        db.query(SalarySlip)
        .filter(SalarySlip.id == slip_id, SalarySlip.employee_id == employee.id)
        .first()
    )
    if not slip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary slip not found")
    if not slip.published_on:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This month's slip is not published yet")

    pdf_bytes = build_salary_slip_pdf(employee, slip, employee.preferred_language)
    filename = f"salary-slip-{slip.month.strftime('%Y-%m')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
