import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "E-Commerce API"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_dev_alpha_task_4_1234567890")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database Configuration
    # Defaults to SQLite to ensure zero-setup runability out of the box,
    # but uses PostgreSQL if a DATABASE_URL is provided.
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ecommerce.db")
    
    # Upload Configurations
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

# Ensure upload directories exist
os.makedirs(os.path.join(settings.UPLOAD_DIR, "products"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "profiles"), exist_ok=True)
