import os
import sys
import uvicorn

def main():
    # Get absolute paths to backend folder
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    
    # Insert backend path to python system path
    sys.path.insert(0, backend_dir)
    
    # Change working directory to backend so database.db and uploads are generated in correct workspace
    os.chdir(backend_dir)
    
    print("=" * 60)
    print("                NexShop Full Stack E-Commerce Platform               ")
    print("=" * 60)
    print("🚀 Booting FastAPI App server on: http://127.0.0.1:8000")
    print("🔒 Default Admin Credentials:")
    print("   📧 Email:    admin@ecommerce.com")
    print("   🔑 Password: adminpassword")
    print("=" * 60)
    
    # Run server
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    main()
