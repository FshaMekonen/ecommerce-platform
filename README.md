# NexShop — E-Commerce Web Application

NexShop is a full-stack e-commerce web application that simulates a real-world online shopping platform. It supports two user roles — **Customer** and **Admin** — each with their own dedicated interface and permissions.

---

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Python, FastAPI, Uvicorn
- **Database:** PostgreSQL / SQLite (auto-fallback)
- **ORM:** SQLAlchemy
- **Authentication:** JWT, Bcrypt
- **Testing:** Pytest, HTTPX

---

## Features

**Customer**
- Register, login, and manage profile
- Browse, search, and filter products
- Add to cart and checkout
- View order history and invoices
- Submit product reviews and ratings

**Admin**
- Dashboard with sales statistics and revenue chart
- Manage products, categories, and images
- Manage orders and update delivery status
- Manage users and moderate reviews

---

## Project Structure

```
ecommerce-platform/
├── backend/               # FastAPI REST API Backend
│   ├── app/               # Application package (models, schemas, routers, tests)
│   ├── .env               # Local environment settings
│   └── requirements.txt   # Python dependencies
├── frontend/              # Single Page Application Frontend
│   ├── css/               # Styling files (main, components, dashboard)
│   ├── js/                # Client state, router, and view components
│   └── index.html         # Main entry page
├── uploads/               # Uploaded product and profile images
├── .env.example           # Environment template
├── .gitignore
├── run.py                 # Application launcher script
└── README.md
```

---

## Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/ecommerce-platform.git
cd ecommerce-platform
```

**2. Create and activate a virtual environment**
```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r backend/requirements.txt
```

**4. Set up environment variables**
```bash
cp .env.example backend/.env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ecommerce_db
SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

> If `DATABASE_URL` is not set, the application will use SQLite automatically.

**5. Create the database** *(PostgreSQL only)*
```sql
CREATE DATABASE ecommerce_db;
```

**6. Run the application**
```bash
python run.py
```

Open `http://127.0.0.1:8000` in your browser.

---

## Default Credentials

| Role     | Email                 | Password      |
|----------|-----------------------|---------------|
| Admin    | admin@ecommerce.com   | adminpassword |
| Customer | Register via the UI   | your choice   |

---

## API Documentation

Available while the server is running:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## Running Tests

```bash
cd backend
pytest app/tests -v
```

---

## Future Roadmap

To expand the application into a complete enterprise e-commerce solution, the following enhancements are planned:

- **Real Payment Integration:** Integrate Stripe or PayPal SDKs to process real credit card payments in test mode.
- **Transactional Notifications:** Set up automated SMTP/SendGrid mailers to dispatch HTML invoices and order status updates.
- **Stock Lock holds:** Implement a 10-minute temporary inventory reservation hold during the checkout phase.
- **Caching & Rate Limiting:** Introduce Redis caching for product lists and rate-limiters on authentication routes for safety.
- **Database Migrations:** Configure Alembic to manage relational schema updates without data loss.
- **Analytics & Reporting:** Expand the admin panel with graphs for monthly revenue, best-selling products, and user counts.

---

## License

This project was developed to demonstrate full-stack development skills.
