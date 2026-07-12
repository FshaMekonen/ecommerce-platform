from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.routers.dependencies import get_current_active_user
from app.utils.security import get_password_hash
from app.utils.uploads import save_uploaded_file

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if user_in.email is not None and user_in.email != current_user.email:
        # Check if email is already taken
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = user_in.email
        
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
        
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/profile/image")
def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Save the file using the upload helper
    image_url = save_uploaded_file(file, "profiles")
    
    # Update user profile image path
    current_user.profile_image = image_url
    db.commit()
    db.refresh(current_user)
    
    return {"profile_image": image_url}
