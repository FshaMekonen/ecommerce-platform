import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine, Base

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Clean up (optional, keep the DB file for inspection if sqlite is used)
    # Base.metadata.drop_all(bind=engine)

def test_public_endpoints():
    # Test products endpoint
    response = client.get("/api/products")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    
    # Test categories endpoint
    response = client.get("/api/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_auth_and_checkout_flow():
    import uuid
    unique_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    
    # 1. Register a customer
    reg_response = client.post("/api/auth/register", json={
        "email": unique_email,
        "full_name": "Test Customer",
        "password": "testpassword123"
    })
    assert reg_response.status_code == 201
    assert reg_response.json()["email"] == unique_email
    
    # 2. Login
    login_response = client.post("/api/auth/login", json={
        "email": unique_email,
        "full_name": "Test Customer",  # Ignored but satisfies schema UserCreate
        "password": "testpassword123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    assert token is not None
    
    # Prepare headers for authenticated requests
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. View profile
    profile_response = client.get("/api/users/profile", headers=headers)
    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == unique_email
    
    # 4. View cart (should be empty initially)
    cart_response = client.get("/api/cart", headers=headers)
    assert cart_response.status_code == 200
    assert len(cart_response.json()["items"]) == 0
