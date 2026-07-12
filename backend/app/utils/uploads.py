import os
import uuid
from fastapi import UploadFile, HTTPException, status
from app.config import settings

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

def save_uploaded_file(file: UploadFile, subfolder: str) -> str:
    # 1. Validate file type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type {file.content_type}. Only JPEG, PNG, and WebP are allowed."
        )
    
    # 2. Validate file size
    # Read the file to check size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)  # Reset file cursor
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 2MB limit."
        )
        
    # 3. Generate unique filename
    extension = os.path.splitext(file.filename)[1]
    if not extension:
        # Fallback extension matching content type
        content_type_map = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        }
        extension = content_type_map.get(file.content_type, ".jpg")
        
    unique_filename = f"{uuid.uuid4().hex}{extension}"
    
    # 4. Save file
    target_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())
        
    # Return relative URL path for client retrieval
    return f"/uploads/{subfolder}/{unique_filename}"
