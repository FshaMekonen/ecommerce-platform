import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.cart import ShoppingCart, CartItem
from app.models.order import Order, OrderItem, Payment
from app.models.inventory import Inventory
from app.schemas.order import OrderCreate, OrderResponse
from app.routers.dependencies import get_current_active_user

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 1. Fetch user cart
    cart = db.query(ShoppingCart).filter(ShoppingCart.user_id == current_user.id).first()
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your shopping cart is empty"
        )
        
    # 2. Verify and process stock
    total_amount = 0.0
    order_items_to_create = []
    
    for item in cart.items:
        product = item.product
        if not product or not product.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {product.name if product else 'Unknown'} is no longer available"
            )
            
        inventory = product.inventory
        if not inventory or inventory.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock for {product.name}. Available: {inventory.stock_quantity if inventory else 0}"
            )
            
        # Deduct inventory stock
        inventory.stock_quantity -= item.quantity
        
        # Calculate item price and add to order
        item_total = float(product.price) * item.quantity
        total_amount += item_total
        
        # Stash details for creation
        order_items_to_create.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "price_at_purchase": product.price
        })
        
    # 3. Create the Order
    order = Order(
        user_id=current_user.id,
        status="paid",  # Auto-marked as paid for simulated instant checkout
        total_amount=round(total_amount, 2),
        shipping_address=order_in.shipping_address,
        billing_address=order_in.billing_address
    )
    db.add(order)
    db.commit()  # Commit to get order ID
    db.refresh(order)
    
    # 4. Create OrderItems
    for item_data in order_items_to_create:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            price_at_purchase=item_data["price_at_purchase"]
        )
        db.add(order_item)
        
    # 5. Create Payment Simulation
    payment = Payment(
        order_id=order.id,
        amount=order.total_amount,
        payment_method=order_in.payment_method,
        transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
        status="completed"
    )
    db.add(payment)
    
    # 6. Clear shopping cart items
    for item in cart.items:
        db.delete(item)
        
    db.commit()
    db.refresh(order)
    
    return order

@router.get("", response_model=List[OrderResponse])
def get_user_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Security check: verify this order belongs to the current user (or user is an admin)
    if order.user_id != current_user.id and current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this order"
        )
        
    return order
