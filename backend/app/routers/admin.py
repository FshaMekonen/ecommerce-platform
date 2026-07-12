from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.product import Product, ProductImage
from app.models.inventory import Inventory
from app.models.order import Order, OrderItem
from app.models.review import Review
from app.models.category import Category
from app.schemas.product import Product as ProductSchema, ProductCreate, ProductUpdate
from app.schemas.category import Category as CategorySchema, CategoryCreate
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.schemas.user import UserResponse
from app.schemas.review import ReviewResponse
from app.routers.dependencies import get_current_admin
from app.utils.uploads import save_uploaded_file

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])

# 1. SALES STATISTICS & ALERTS
@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Total Users count
    total_users = db.query(User).count()
    
    # Total Products count
    total_products = db.query(Product).count()
    
    # Total Orders count
    total_orders = db.query(Order).count()
    
    # Revenue Summary (Total paid/delivered revenue)
    revenue_result = db.query(func.sum(Order.total_amount)).filter(Order.status.in_(["paid", "shipped", "delivered"])).scalar()
    total_revenue = float(revenue_result) if revenue_result is not None else 0.0
    
    # Low stock alerts (products where stock <= reorder_level)
    low_stock = db.query(Product).join(Inventory).filter(
        Inventory.stock_quantity <= Inventory.reorder_level
    ).all()
    
    # Re-map low stock items to simple dict for display
    low_stock_alerts = []
    for p in low_stock:
        low_stock_alerts.append({
            "id": p.id,
            "name": p.name,
            "stock": p.inventory.stock_quantity,
            "reorder_level": p.inventory.reorder_level
        })
        
    # Recent Orders (last 10)
    recent = db.query(Order).order_by(Order.created_at.desc()).limit(10).all()
    recent_orders = []
    for r in recent:
        recent_orders.append({
            "id": r.id,
            "customer_name": r.user.full_name,
            "total_amount": float(r.total_amount),
            "status": r.status,
            "created_at": r.created_at
        })
        
    # Sales Trend for Charts (revenue grouped by day for the last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    trend = db.query(
        func.date(Order.created_at).label("day"),
        func.sum(Order.total_amount).label("rev")
    ).filter(
        Order.created_at >= seven_days_ago,
        Order.status.in_(["paid", "shipped", "delivered"])
    ).group_by(func.date(Order.created_at)).order_by("day").all()
    
    sales_trend = [{"date": str(t.day), "revenue": float(t.rev)} for t in trend]
    
    return {
        "total_users": total_users,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "low_stock_alerts": low_stock_alerts,
        "recent_orders": recent_orders,
        "sales_trend": sales_trend
    }

# 2. PRODUCT MANAGEMENT (CRUD)
@router.post("/products", response_model=ProductSchema)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    # Create product entry
    product = Product(
        name=product_in.name,
        description=product_in.description,
        price=product_in.price,
        category_id=product_in.category_id,
        is_available=product_in.is_available
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Initialize Inventory entry
    inventory = Inventory(
        product_id=product.id,
        stock_quantity=product_in.stock_quantity,
        reorder_level=product_in.reorder_level
    )
    db.add(inventory)
    db.commit()
    db.refresh(product)
    
    return product

@router.put("/products/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Update product fields
    if product_in.name is not None:
        product.name = product_in.name
    if product_in.description is not None:
        product.description = product_in.description
    if product_in.price is not None:
        product.price = product_in.price
    if product_in.category_id is not None:
        product.category_id = product_in.category_id
    if product_in.is_available is not None:
        product.is_available = product_in.is_available
        
    # Update inventory fields if provided
    if product.inventory:
        if product_in.stock_quantity is not None:
            product.inventory.stock_quantity = product_in.stock_quantity
        if product_in.reorder_level is not None:
            product.inventory.reorder_level = product_in.reorder_level
            
    db.commit()
    db.refresh(product)
    return product

@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Delete product (cascades will delete images, inventory, reviews)
    db.delete(product)
    db.commit()
    return {"detail": "Product deleted successfully"}

@router.post("/products/{product_id}/images")
def upload_product_image(
    product_id: int,
    is_primary: bool = False,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Save the file using the upload helper
    image_url = save_uploaded_file(file, "products")
    
    # If is_primary, make other images of this product non-primary
    if is_primary:
        db.query(ProductImage).filter(ProductImage.product_id == product_id).update({"is_primary": False})
        
    # Create product image record
    new_image = ProductImage(
        product_id=product_id,
        image_url=image_url,
        is_primary=is_primary
    )
    db.add(new_image)
    db.commit()
    
    return {"image_url": image_url}

# 3. CATEGORY MANAGEMENT (CRUD)
@router.post("/categories", response_model=CategorySchema)
def create_category(category_in: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name == category_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
        
    category = Category(name=category_in.name, description=category_in.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/categories/{category_id}", response_model=CategorySchema)
def update_category(category_id: int, category_in: CategoryCreate, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Check duplicate name
    dup = db.query(Category).filter(Category.name == category_in.name, Category.id != category_id).first()
    if dup:
        raise HTTPException(status_code=400, detail="Category name already in use")
        
    category.name = category_in.name
    category.description = category_in.description
    db.commit()
    db.refresh(category)
    return category

@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Check if there are active products using this category
    count = db.query(Product).filter(Product.category_id == category_id).count()
    if count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category that contains products")
        
    db.delete(category)
    db.commit()
    return {"detail": "Category deleted successfully"}

# 4. ORDER MANAGEMENT
@router.get("/orders")
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "user_id": order.user_id,
            "customer_name": order.user.full_name if order.user else f"User #{order.user_id}",
            "status": order.status,
            "total_amount": float(order.total_amount),
            "shipping_address": order.shipping_address,
            "billing_address": order.billing_address,
            "created_at": order.created_at.isoformat() if order.created_at else None,
            "updated_at": order.updated_at.isoformat() if order.updated_at else None,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "price_at_purchase": float(item.price_at_purchase),
                    "product": {
                        "id": item.product.id,
                        "name": item.product.name,
                        "price": float(item.product.price),
                        "description": item.product.description,
                        "category_id": item.product.category_id,
                        "is_available": item.product.is_available,
                        "created_at": item.product.created_at.isoformat() if item.product.created_at else None,
                        "updated_at": item.product.updated_at.isoformat() if item.product.updated_at else None,
                        "images": [{"id": img.id, "image_url": img.image_url, "is_primary": img.is_primary} for img in item.product.images],
                        "inventory": {"stock_quantity": item.product.inventory.stock_quantity, "reorder_level": item.product.inventory.reorder_level} if item.product.inventory else None,
                        "average_rating": None,
                        "review_count": 0,
                        "category": None
                    } if item.product else None
                }
                for item in order.items
            ],
            "payments": [
                {
                    "id": pay.id,
                    "amount": float(pay.amount),
                    "payment_method": pay.payment_method,
                    "transaction_id": pay.transaction_id,
                    "status": pay.status,
                    "created_at": pay.created_at.isoformat() if pay.created_at else None
                }
                for pay in order.payments
            ]
        })
    return result

@router.put("/orders/{order_id}", response_model=OrderResponse)
def update_order_status(order_id: int, status_in: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.status = status_in.status
    db.commit()
    db.refresh(order)
    return order

# 5. USER MANAGEMENT
@router.get("/users", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.id).all()

@router.put("/users/{user_id}/status", response_model=UserResponse)
def toggle_user_active_status(user_id: int, is_active: bool, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}/role", response_model=UserResponse)
def change_user_role(user_id: int, role_name: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail="Role does not exist")
        
    user.role_id = role.id
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}

# 6. REVIEW MODERATION
@router.get("/reviews", response_model=List[ReviewResponse])
def get_all_reviews(db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.created_at.desc()).all()

@router.delete("/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    db.delete(review)
    db.commit()
    return {"detail": "Review deleted successfully"}
