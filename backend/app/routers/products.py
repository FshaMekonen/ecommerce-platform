from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from decimal import Decimal

from app.database import get_db
from app.models.product import Product, ProductImage
from app.models.review import Review
from app.schemas.product import Product as ProductSchema

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("", response_model=List[ProductSchema])
def get_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    min_rating: Optional[float] = None,
    is_available: Optional[bool] = None,
    sort_by: Optional[str] = "newest",  # name, price_asc, price_desc, newest
    db: Session = Depends(get_db)
):
    # Base query calculating average rating and review count per product
    query = db.query(
        Product,
        func.avg(Review.rating).label("rating_avg"),
        func.count(Review.rating).label("rating_count")
    ).outerjoin(Review).group_by(Product.id)
    
    # 1. Search filter
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.description.ilike(f"%{search}%"))
        
    # 2. Category filter
    if category_id:
        query = query.filter(Product.category_id == category_id)
        
    # 3. Price filter
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
        
    # 4. Availability filter
    if is_available is not None:
        query = query.filter(Product.is_available == is_available)
        
    # 5. Rating filter (HAVING clause since we use grouping)
    if min_rating is not None:
        query = query.having(func.avg(Review.rating) >= min_rating)
        
    # 6. Sorting
    if sort_by == "name":
        query = query.order_by(Product.name.asc())
    elif sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        query = query.order_by(Product.created_at.desc())
        
    results = query.all()
    
    # Map raw SQLAlchemy tuples back into schemas
    products = []
    for p, avg, count in results:
        # Inject computed properties into the model instance
        p.rating_avg = round(float(avg), 2) if avg is not None else None
        p.rating_count = count
        products.append(p)
        
    return products

@router.get("/{product_id}", response_model=ProductSchema)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    # Query product with details
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    # Calculate average rating and count
    avg_count = db.query(
        func.avg(Review.rating).label("avg"),
        func.count(Review.rating).label("count")
    ).filter(Review.product_id == product_id).first()
    
    product.rating_avg = round(float(avg_count.avg), 2) if avg_count.avg is not None else None
    product.rating_count = avg_count.count
    
    return product
