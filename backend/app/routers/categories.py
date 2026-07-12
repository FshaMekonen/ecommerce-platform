from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.category import Category
from app.schemas.category import Category as CategorySchema

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.name).all()
