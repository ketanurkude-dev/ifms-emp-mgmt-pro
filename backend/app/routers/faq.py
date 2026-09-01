from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Faq
from app.schemas import FaqOut

router = APIRouter(prefix="/faq", tags=["faq"])


@router.get("", response_model=list[FaqOut])
def list_faqs(db: Session = Depends(get_db)):
    return db.query(Faq).filter(Faq.is_deleted.is_(False)).all()
