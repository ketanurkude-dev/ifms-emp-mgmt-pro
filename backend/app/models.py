from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditMixin:
    """Common columns every table should have. Add this to any new model."""

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    server_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    operation_date: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


# Roles for approval workflow. Kept as a plain string (not a DB enum) so a
# junior dev can read/extend the list without touching a migration.
ROLES = ["employee", "ddo", "hod"]


class Employee(AuditMixin, Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str | None] = mapped_column(String(120), unique=True, nullable=True)
    mobile: Mapped[str] = mapped_column(String(15), nullable=False)
    designation: Mapped[str] = mapped_column(String(120), nullable=False)
    office: Mapped[str] = mapped_column(String(150), nullable=False)
    ddo_code: Mapped[str] = mapped_column(String(30), nullable=False)
    date_of_joining: Mapped[date] = mapped_column(Date, nullable=False)
    date_of_superannuation: Mapped[date] = mapped_column(Date, nullable=False)
    basic_pay: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="employee", nullable=False)
    gpf_series: Mapped[str | None] = mapped_column(String(30), nullable=True)
    gpf_account_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(5), default="en", nullable=False)  # "en" | "hi"


class SalarySlip(AuditMixin, Base):
    __tablename__ = "salary_slips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    month: Mapped[date] = mapped_column(Date, nullable=False)
    basic_pay: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    dearness_allowance: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    house_rent_allowance: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    transport_allowance: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    gpf_subscription: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    income_tax: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    professional_tax: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    gross: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    deductions: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    net: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    published_on: Mapped[date | None] = mapped_column(Date, nullable=True)


class EmployeeRequest(AuditMixin, Base):
    __tablename__ = "employee_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    request_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="Submitted", nullable=False)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    review_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class GpfLedgerEntry(AuditMixin, Base):
    __tablename__ = "gpf_ledger_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    month: Mapped[date] = mapped_column(Date, nullable=False)
    subscription: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    advance: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    withdrawal: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    refund: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    interest: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    closing_balance: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)


class Certificate(AuditMixin, Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    certificate_type: Mapped[str] = mapped_column(String(60), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Submitted", nullable=False)
    certificate_number: Mapped[str | None] = mapped_column(String(60), nullable=True)
    issued_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    review_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)


class Circular(AuditMixin, Base):
    __tablename__ = "circulars"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    issuing_office: Mapped[str] = mapped_column(String(150), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    published_on: Mapped[date] = mapped_column(Date, nullable=False)
    requires_ack: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)


class CircularAcknowledgement(AuditMixin, Base):
    __tablename__ = "circular_acknowledgements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    circular_id: Mapped[int] = mapped_column(ForeignKey("circulars.id"), nullable=False, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class Grievance(AuditMixin, Base):
    __tablename__ = "grievances"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Submitted", nullable=False)
    reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)


class TaxDeclarationLine(AuditMixin, Base):
    __tablename__ = "tax_declaration_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    financial_year: Mapped[str] = mapped_column(String(10), nullable=False)
    section: Mapped[str] = mapped_column(String(20), nullable=False)
    instrument: Mapped[str] = mapped_column(String(120), nullable=False)
    declared_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    proof_uploaded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Submitted", nullable=False)


class TaxDocument(AuditMixin, Base):
    __tablename__ = "tax_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    financial_year: Mapped[str] = mapped_column(String(10), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(60), nullable=False)
    issued_on: Mapped[date | None] = mapped_column(Date, nullable=True)


class PensionCase(AuditMixin, Base):
    __tablename__ = "pension_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, index=True)
    is_family_pension: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    stage: Mapped[str] = mapped_column(String(50), default="Forms received", nullable=False)
    forms_completion_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)


class Faq(AuditMixin, Base):
    __tablename__ = "faqs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)


class AuditLog(AuditMixin, Base):
    """Immutable trail of significant actions -- logins, OTP events, and
    every create/update/approve/reject across the portal."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True, index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    actor_role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    action: Mapped[str] = mapped_column(String(60), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(40), nullable=False)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    before_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    after_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    result: Mapped[str] = mapped_column(String(20), default="Success", nullable=False)
    correlation_id: Mapped[str | None] = mapped_column(String(60), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
