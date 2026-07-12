from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.cart import ShoppingCart, CartItem
from app.models.product import Product
from app.schemas.cart import ShoppingCartResponse, CartItemCreate, CartItemUpdate
from app.routers.dependencies import get_current_active_user

router = APIRouter(prefix="/api/cart", tags=["cart"])

@router.get("", response_model=ShoppingCartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Ensure user has a cart
    cart = db.query(ShoppingCart).filter(ShoppingCart.user_id == current_user.id).first()
    if not cart:
        cart = ShoppingCart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    # Calculate total price
    total = 0.0
    for item in cart.items:
        if item.product:
            total += float(item.product.price) * item.quantity
            
    # Explicitly attach total_price to the cart object so the schema can read it
    cart.total_price = round(total, 2)
    return cart

@router.post("/items", response_model=ShoppingCartResponse)
def add_to_cart(
    item_in: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # 1. Fetch user's cart
    cart = db.query(ShoppingCart).filter(ShoppingCart.user_id == current_user.id).first()
    if not cart:
        cart = ShoppingCart(user_id=current_user.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    # 2. Verify product exists, is available, and has stock
    product = db.query(Product).filter(Product.id == item_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.is_available:
        raise HTTPException(status_code=400, detail="Product is currently unavailable")
        
    stock = product.inventory.stock_quantity if product.inventory else 0
    
    # 3. Check if item is already in cart
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == item_in.product_id
    ).first()
    
    target_quantity = item_in.quantity
    if existing_item:
        target_quantity += existing_item.quantity
        
    if target_quantity > stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot add {item_in.quantity} items. Only {stock} items available in stock."
        )
        
    if existing_item:
        existing_item.quantity = target_quantity
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity
        )
        db.add(new_item)
        
    db.commit()
    db.refresh(cart)
    
    # Recalculate total
    total = sum(float(item.product.price) * item.quantity for item in cart.items if item.product)
    cart.total_price = round(total, 2)
    
    return cart

@router.put("/items/{item_id}", response_model=ShoppingCartResponse)
def update_cart_item(
    item_id: int,
    item_in: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cart = db.query(ShoppingCart).filter(ShoppingCart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    cart_item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
        
    # Check stock
    product = cart_item.product
    stock = product.inventory.stock_quantity if product and product.inventory else 0
    if item_in.quantity > stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot set quantity to {item_in.quantity}. Only {stock} items available in stock."
        )
        
    cart_item.quantity = item_in.quantity
    db.commit()
    db.refresh(cart)
    
    # Recalculate total
    total = sum(float(item.product.price) * item.quantity for item in cart.items if item.product)
    cart.total_price = round(total, 2)
    
    return cart

@router.delete("/items/{item_id}", response_model=ShoppingCartResponse)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    cart = db.query(ShoppingCart).filter(ShoppingCart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    cart_item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
        
    db.delete(cart_item)
    db.commit()
    db.refresh(cart)
    
    # Recalculate total
    total = sum(float(item.product.price) * item.quantity for item in cart.items if item.product)
    cart.total_price = round(total, 2)
    
    return cart
