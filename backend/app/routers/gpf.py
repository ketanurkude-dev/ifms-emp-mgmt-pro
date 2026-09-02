from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models import Employee, GpfLedgerEntry
from app.pdf import build_gpf_annual_statement_pdf
from app.schemas import GpfLedgerOut

router = APIRouter(prefix="/gpf", tags=["gpf"])


@router.get("/ledger", response_model=list[GpfLedgerOut])
def get_ledger(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(GpfLedgerEntry)
        .filter(GpfLedgerEntry.employee_id == employee.id, GpfLedgerEntry.is_deleted.is_(False))
        .order_by(GpfLedgerEntry.month.desc())
        .all()
    )


@router.get("/annual-statement/pdf")
def download_annual_statement_pdf(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(GpfLedgerEntry)
        .filter(GpfLedgerEntry.employee_id == employee.id, GpfLedgerEntry.is_deleted.is_(False))
        .order_by(GpfLedgerEntry.month)
        .all()
    )
    if not entries:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No GPF ledger entries found")

    year_label = f"{entries[0].month.strftime('%b %Y')} to {entries[-1].month.strftime('%b %Y')}"
    pdf_bytes = build_gpf_annual_statement_pdf(employee, entries, year_label, employee.preferred_language)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="gpf-annual-statement.pdf"'},
    )
