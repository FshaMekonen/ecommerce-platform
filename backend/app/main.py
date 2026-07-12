import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import Role, User
from app.utils.security import get_password_hash
from app.routers import auth, users, products, categories, cart, orders, reviews, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Automatically create all tables on startup (no manual migrations required for basic run)
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed basic roles and default admin user if not present
    db = SessionLocal()
    try:
        # Seed customer role
        customer_role = db.query(Role).filter(Role.name == "customer").first()
        if not customer_role:
            customer_role = Role(name="customer", description="Standard customer role")
            db.add(customer_role)
            
        # Seed admin role
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        if not admin_role:
            admin_role = Role(name="admin", description="Administrative dashboard manager")
            db.add(admin_role)
            
        db.commit()
        
        # Seed default admin user
        admin_email = "admin@ecommerce.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_role = db.query(Role).filter(Role.name == "admin").first()
            hashed_pwd = get_password_hash("adminpassword")
            admin_user = User(
                email=admin_email,
                hashed_password=hashed_pwd,
                full_name="System Administrator",
                role_id=admin_role.id,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print(f"Default admin user seeded: {admin_email} / adminpassword")
            
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Configure CORS (useful if frontend is run separately)
# Disable caching for static files during development
@app.middleware("http")
async def add_no_cache_header(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(admin.router)

# Mount media uploads static route
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount CSS & JS frontend static paths
frontend_dir = os.path.join(settings.BASE_DIR, "frontend")
os.makedirs(os.path.join(frontend_dir, "css"), exist_ok=True)
os.makedirs(os.path.join(frontend_dir, "js"), exist_ok=True)

app.mount("/css", StaticFiles(directory=os.path.join(frontend_dir, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(frontend_dir, "js")), name="js")

# Fallback route to serve the Single Page App (index.html)
@app.get("/")
def read_index():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

@app.get("/{full_path:path}")
def catch_all(full_path: str):
    # Exclude API endpoints from frontend catch-all
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
        raise HTTPException(status_code=404, detail="API route not found")
        
    # Serve index.html for SPA history-mode routing or fallback
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"detail": "SPA index.html not found"}
