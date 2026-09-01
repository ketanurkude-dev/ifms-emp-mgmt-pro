from datetime import datetime, timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Employee

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(subject: str, purpose: str, expires_minutes: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload = {"sub": subject, "purpose": purpose, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str, expected_purpose: str) -> str:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    if payload.get("purpose") != expected_purpose:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token purpose")

    return payload["sub"]


def get_current_employee(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Employee:
    employee_code = decode_token(token, expected_purpose="access")
    employee = (
        db.query(Employee)
        .filter(Employee.employee_code == employee_code, Employee.is_deleted.is_(False))
        .first()
    )
    if not employee or not employee.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not found")
    return employee


def require_approver(employee: Employee = Depends(get_current_employee)) -> Employee:
    """Use as a dependency on any endpoint only a DDO or HOD may call."""
    if employee.role not in ("ddo", "hod"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Approver role required")
    return employee
