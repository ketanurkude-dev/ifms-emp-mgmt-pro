from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.events import log_action
from app.models import Certificate, Employee
from app.pdf import build_certificate_pdf
from app.schemas import CertificateCreate, CertificateOut, CertificateVerifyOut

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("", response_model=list[CertificateOut])
def list_my_certificates(
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    return (
        db.query(Certificate)
        .filter(Certificate.employee_id == employee.id, Certificate.is_deleted.is_(False))
        .order_by(Certificate.server_date.desc())
        .all()
    )


@router.post("", response_model=CertificateOut, status_code=status.HTTP_201_CREATED)
def request_certificate(
    payload: CertificateCreate,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    certificate = Certificate(
        employee_id=employee.id,
        certificate_type=payload.certificate_type,
        purpose=payload.purpose,
    )
    db.add(certificate)
    db.commit()
    db.refresh(certificate)
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=employee.role, action="Certificate requested", entity_type="Certificate", entity_id=certificate.id, after_value=payload.certificate_type)
    db.commit()
    return certificate


@router.get("/verify/{certificate_number:path}", response_model=CertificateVerifyOut)
def verify_certificate(certificate_number: str, db: Session = Depends(get_db)):
    """Public endpoint (no login) so anyone holding a certificate can confirm
    it was genuinely issued by this portal -- the SRS's "Verify" link."""
    certificate = (
        db.query(Certificate)
        .filter(Certificate.certificate_number == certificate_number, Certificate.status == "Approved")
        .first()
    )
    if not certificate:
        return CertificateVerifyOut(valid=False, message="No matching issued certificate was found.")

    employee = db.query(Employee).filter(Employee.id == certificate.employee_id).first()
    return CertificateVerifyOut(
        valid=True,
        certificate_number=certificate.certificate_number,
        certificate_type=certificate.certificate_type,
        employee_name=employee.name if employee else None,
        employee_code=employee.employee_code if employee else None,
        issued_on=certificate.issued_on,
        message="This certificate was genuinely issued by the Employee Portal.",
    )


@router.get("/{certificate_id}/pdf")
def download_certificate_pdf(
    certificate_id: int,
    employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db),
):
    certificate = (
        db.query(Certificate)
        .filter(Certificate.id == certificate_id, Certificate.employee_id == employee.id)
        .first()
    )
    if not certificate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found")
    if certificate.status != "Approved":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Certificate has not been issued yet")

    pdf_bytes = build_certificate_pdf(employee, certificate, employee.preferred_language)
    filename = f"certificate-{certificate.certificate_number}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
