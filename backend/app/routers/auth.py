from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_token, decode_token, get_current_employee, hash_password, verify_password
from app.config import settings
from app.database import get_db
from app.events import log_action
from app.models import ROLES, Employee
from app.schemas import LoginRequest, LoginResponse, RegisterRequest, TokenResponse, VerifyOtpRequest
from app.seed import build_gpf_ledger, build_salary_slips, build_tax_documents

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = (
        db.query(Employee)
        .filter(Employee.employee_code == payload.employee_code, Employee.is_deleted.is_(False))
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee code already registered")

    role = payload.role if payload.role in ROLES else "employee"

    employee = Employee(
        employee_code=payload.employee_code,
        name=payload.name,
        email=payload.email,
        mobile=payload.mobile,
        designation=payload.designation,
        office=payload.office,
        ddo_code=payload.ddo_code,
        date_of_joining=payload.date_of_joining,
        date_of_superannuation=payload.date_of_superannuation,
        basic_pay=payload.basic_pay,
        password_hash=hash_password(payload.password),
        role=role,
        gpf_series=f"DL/{payload.ddo_code}",
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    employee.gpf_account_number = f"{employee.gpf_series}/{10000 + employee.id}"
    db.add_all(build_salary_slips(employee.id, float(employee.basic_pay)))
    db.add_all(build_gpf_ledger(employee.id, float(employee.basic_pay)))
    db.add_all(build_tax_documents(employee.id))
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=role, action="Registered", entity_type="Employee", entity_id=employee.id)
    db.commit()

    return {"message": "Registration successful. You can now log in."}


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    employee = (
        db.query(Employee)
        .filter(Employee.employee_code == payload.employee_code, Employee.is_deleted.is_(False))
        .first()
    )
    if not employee or not verify_password(payload.password, employee.password_hash):
        log_action(
            db, employee_id=employee.id if employee else None, actor_id=employee.id if employee else None,
            actor_role=employee.role if employee else None, action="Failed login", entity_type="Employee",
            entity_id=employee.id if employee else None, result="Failure",
            details=f"Attempted login for {payload.employee_code}",
        )
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid employee code or password")
    if not employee.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    pending_token = create_token(employee.employee_code, purpose="otp_pending", expires_minutes=5)
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=employee.role, action="Password verified", entity_type="Employee", entity_id=employee.id)
    db.commit()
    return LoginResponse(pending_token=pending_token)


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    if not payload.otp.isdigit():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP must be 6 digits")

    employee_code = decode_token(payload.pending_token, expected_purpose="otp_pending")
    employee = (
        db.query(Employee)
        .filter(Employee.employee_code == employee_code, Employee.is_deleted.is_(False))
        .first()
    )
    if not employee:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not found")

    access_token = create_token(
        employee.employee_code, purpose="access", expires_minutes=settings.access_token_expire_minutes
    )
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=employee.role, action="Login", entity_type="Employee", entity_id=employee.id)
    db.commit()
    return TokenResponse(access_token=access_token)


@router.post("/logout")
def logout(employee: Employee = Depends(get_current_employee), db: Session = Depends(get_db)):
    log_action(db, employee_id=employee.id, actor_id=employee.id, actor_role=employee.role, action="Logout", entity_type="Employee", entity_id=employee.id)
    db.commit()
    return {"message": "Logged out"}
