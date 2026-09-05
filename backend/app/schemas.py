from datetime import date, datetime

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    employee_code: str = Field(min_length=3, max_length=20)
    name: str
    email: str | None = None
    mobile: str = Field(min_length=10, max_length=15)
    designation: str
    office: str
    ddo_code: str
    date_of_joining: date
    date_of_superannuation: date
    basic_pay: float
    password: str = Field(min_length=6)
    role: str = "employee"  # "employee" | "ddo" | "hod" -- lets a demo approver account be created


class LoginRequest(BaseModel):
    employee_code: str
    password: str


class LoginResponse(BaseModel):
    pending_token: str
    message: str = "Password verified. Enter the OTP sent to your registered mobile."


class VerifyOtpRequest(BaseModel):
    pending_token: str
    otp: str = Field(min_length=6, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class EmployeeOut(BaseModel):
    employee_code: str
    name: str
    email: str | None
    mobile: str
    designation: str
    office: str
    ddo_code: str
    date_of_joining: date
    date_of_superannuation: date
    basic_pay: float
    role: str
    gpf_series: str | None
    gpf_account_number: str | None
    preferred_language: str

    class Config:
        from_attributes = True


class LanguageUpdate(BaseModel):
    language: str  # "en" | "hi"


class ProfileUpdateRequest(BaseModel):
    email: str | None = None
    mobile: str = Field(min_length=10, max_length=15)


class SalarySlipOut(BaseModel):
    id: int
    month: date
    basic_pay: float
    dearness_allowance: float
    house_rent_allowance: float
    transport_allowance: float
    gpf_subscription: float
    income_tax: float
    professional_tax: float
    gross: float
    deductions: float
    net: float
    published_on: date | None

    class Config:
        from_attributes = True


class RequestCreate(BaseModel):
    request_type: str
    title: str
    description: str | None = None
    amount: float | None = None


class RequestOut(BaseModel):
    id: int
    employee_id: int
    request_type: str
    title: str
    description: str | None
    amount: float | None
    status: str
    review_remarks: str | None
    reviewed_at: datetime | None
    server_date: datetime

    class Config:
        from_attributes = True


class ReviewRequest(BaseModel):
    status: str  # "Approved" | "Rejected" | "Returned"
    review_remarks: str | None = None


class GpfLedgerOut(BaseModel):
    month: date
    subscription: float
    advance: float
    withdrawal: float
    refund: float
    interest: float
    closing_balance: float

    class Config:
        from_attributes = True


class CertificateCreate(BaseModel):
    certificate_type: str
    purpose: str


class CertificateOut(BaseModel):
    id: int
    employee_id: int
    certificate_type: str
    purpose: str
    status: str
    certificate_number: str | None
    issued_on: date | None
    review_remarks: str | None
    server_date: datetime

    class Config:
        from_attributes = True


class CertificateVerifyOut(BaseModel):
    valid: bool
    certificate_number: str | None = None
    certificate_type: str | None = None
    employee_name: str | None = None
    employee_code: str | None = None
    issued_on: date | None = None
    message: str


class CircularOut(BaseModel):
    id: int
    title: str
    category: str
    issuing_office: str
    content: str
    published_on: date
    requires_ack: bool
    acknowledged: bool = False

    class Config:
        from_attributes = True


class CircularCreate(BaseModel):
    title: str
    category: str
    issuing_office: str
    content: str
    requires_ack: bool = False


class GrievanceCreate(BaseModel):
    category: str
    subject: str
    description: str


class GrievanceOut(BaseModel):
    id: int
    employee_id: int
    category: str
    subject: str
    description: str
    status: str
    reply: str | None
    rating: int | None
    closed_at: datetime | None
    server_date: datetime

    class Config:
        from_attributes = True


class GrievanceReply(BaseModel):
    reply: str
    status: str = "Closed"


class GrievanceRating(BaseModel):
    rating: int = Field(ge=1, le=5)


class TaxDeclarationLineCreate(BaseModel):
    financial_year: str
    section: str
    instrument: str
    declared_amount: float


class TaxDeclarationLineOut(BaseModel):
    id: int
    financial_year: str
    section: str
    instrument: str
    declared_amount: float
    proof_uploaded: bool
    status: str

    class Config:
        from_attributes = True


class TaxDocumentOut(BaseModel):
    id: int
    financial_year: str
    doc_type: str
    issued_on: date | None

    class Config:
        from_attributes = True


class PensionCaseOut(BaseModel):
    is_family_pension: bool
    stage: str
    forms_completion_percent: int
    remarks: str | None

    class Config:
        from_attributes = True


class FaqOut(BaseModel):
    category: str
    question: str
    answer: str

    class Config:
        from_attributes = True


class ApproverQueueItem(BaseModel):
    kind: str  # "request" | "certificate" | "grievance"
    id: int
    employee_id: int
    employee_name: str
    employee_designation: str | None = None
    employee_office: str | None = None
    title: str
    description: str | None = None
    amount: float | None = None
    status: str
    server_date: datetime


class AuditLogOut(BaseModel):
    id: int
    employee_id: int | None
    actor_id: int | None
    actor_role: str | None
    action: str
    entity_type: str
    entity_id: int | None
    before_value: str | None
    after_value: str | None
    result: str
    correlation_id: str | None
    details: str | None
    server_date: datetime

    class Config:
        from_attributes = True
