from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.models.cart import ShoppingCart
from app.schemas.user import UserCreate, UserResponse, Token
from app.utils.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if email already registered
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 2. Get or create Customer role
    customer_role = db.query(Role).filter(Role.name == "customer").first()
    if not customer_role:
        customer_role = Role(name="customer", description="Standard customer role")
        db.add(customer_role)
        db.commit()
        db.refresh(customer_role)
        
    # 3. Create user
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role_id=customer_role.id,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 4. Create shopping cart for new user
    cart = ShoppingCart(user_id=new_user.id)
    db.add(cart)
    db.commit()
    
    return new_user

@router.post("/login", response_model=Token)
def login_json(user_in: UserCreate, db: Session = Depends(get_db)):
    # JSON body login (used by frontend Fetch SPA)
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    role_name = user.role.name if user.role else "customer"
    access_token = create_access_token(data={"sub": user.email, "role": role_name})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.post("/login-form", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Form-data login (used by Swagger UI & OAuth2 flow)
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    role_name = user.role.name if user.role else "customer"
    access_token = create_access_token(data={"sub": user.email, "role": role_name})
    return {"access_token": access_token, "token_type": "bearer", "user": user}
