from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models import Employee, TaxDeclarationLine, TaxDocument
from app.pdf import build_tax_document_pdf
from app.schemas import TaxDeclarationLineCreate, TaxDeclarationLineOut, TaxDocumentOut

router = APIRouter(prefix="/tax", tags=["tax"])

# Simple ceiling per section, matching the SRS's "ceiling warning" requirement.
SECTION_CEILINGS = {
    "80C": 150000,
    "80CCD(1B)": 50000,
    "80D": 25000,
    "80E": None,
    "80G": None,
    "80TTA": 10000,
    "24(b)": 200000,
}


@router.get("/declarations", response_model=list[TaxDeclarationLineOut])
def list_declarations(
    financial_year: str,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(TaxDeclarationLine)
        .filter(
            TaxDeclarationLine.employee_id == employee.id,
            TaxDeclarationLine.financial_year == financial_year,
            TaxDeclarationLine.is_deleted.is_(False),
        )
        .all()
    )


@router.post("/declarations", response_model=TaxDeclarationLineOut, status_code=status.HTTP_201_CREATED)
def add_declaration(
    payload: TaxDeclarationLineCreate,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    ceiling = SECTION_CEILINGS.get(payload.section)
    if ceiling is not None:
        existing_total = (
            db.query(TaxDeclarationLine)
            .filter(
                TaxDeclarationLine.employee_id == employee.id,
                TaxDeclarationLine.financial_year == payload.financial_year,
                TaxDeclarationLine.section == payload.section,
            )
            .all()
        )
        total_so_far = sum(float(line.declared_amount) for line in existing_total)
        if total_so_far + payload.declared_amount > ceiling:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Declared amount exceeds the {payload.section} ceiling of Rs. {ceiling}",
            )

    line = TaxDeclarationLine(
        employee_id=employee.id,
        financial_year=payload.financial_year,
        section=payload.section,
        instrument=payload.instrument,
        declared_amount=payload.declared_amount,
    )
    db.add(line)
    db.commit()
    db.refresh(line)
    return line


@router.get("/documents", response_model=list[TaxDocumentOut])
def list_tax_documents(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(TaxDocument)
        .filter(TaxDocument.employee_id == employee.id, TaxDocument.is_deleted.is_(False))
        .order_by(TaxDocument.financial_year.desc())
        .all()
    )


@router.get("/documents/{document_id}/pdf")
def download_tax_document_pdf(
    document_id: int,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    document = (
        db.query(TaxDocument)
        .filter(TaxDocument.id == document_id, TaxDocument.employee_id == employee.id)
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if not document.issued_on:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Document has not been issued yet")

    pdf_bytes = build_tax_document_pdf(employee, document)
    filename = f"{document.doc_type.replace(' ', '-').lower()}-{document.financial_year}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
