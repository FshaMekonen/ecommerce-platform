from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.review import Review
from app.models.order import Order, OrderItem
from app.schemas.review import ReviewCreate, ReviewResponse
from app.routers.dependencies import get_current_active_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_product_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Premium constraint: Verify customer purchased the product first
    purchased = db.query(OrderItem).join(Order).filter(
        Order.user_id == current_user.id,
        OrderItem.product_id == review_in.product_id,
        Order.status.in_(["paid", "shipped", "delivered"])
    ).first()
    
    if not purchased:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only review products you have purchased and paid for."
        )
        
    # Check if review already exists from this user for this product
    existing = db.query(Review).filter(
        Review.product_id == review_in.product_id,
        Review.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this product."
        )
        
    new_review = Review(
        product_id=review_in.product_id,
        user_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    return new_review
