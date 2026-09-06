# 🚗 Value Cars - Modern Used Car Platform

> A production-grade, Spinny/Cars24-style used-car buying, selling, inspection, and inventory management platform.

---

## 🌟 Key Features

- **🛍️ Customer Marketplace**: Real-time vehicle search, dynamic multi-attribute filters, full image galleries, interactive 100+ point digital inspection reports, and instant test-drive bookings.
- **🔍 Digital Inspection App**: Multi-point inspection checklist (Engine, Exterior, Interior, Suspension, Electrical, Tyres), defect tagging, photo uploads, and automatic score calculation.
- **📊 Admin CRM & Inventory**: Lead management funnel (New $\rightarrow$ Contacted $\rightarrow$ Test Drive $\rightarrow$ Negotiation $\rightarrow$ Won), car procurement, valuation pricing engine, and sales analytics.
- **💳 Reservation & Payment Engine**: Token reservation workflow, order management, and secure webhook verification.
- **🛡️ Secure Foundation**: JWT authentication, Mobile OTP simulation, Role-Based Access Control (RBAC), and SQLAlchemy 2.0 Async ORM with PostgreSQL.

---

## 🏗️ Architecture Overview

```
                      +-----------------------------+
                      |   Next.js 14 Web Frontend   |
                      |  (Customer / Admin / Insp)  |
                      +--------------+--------------+
                                     |  REST API
                                     v
                      +-----------------------------+
                      |     FastAPI Backend API     |
                      |          (/api/v1)          |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                     |                     |
               v                     v                     v
      +-----------------+   +-----------------+   +-----------------+
      |  PostgreSQL 16  |   |     Redis 7     |   | S3 Storage (R2) |
      |  (Relational)   |   | (Cache / Rate)  |   | (Images / PDFs) |
      +-----------------+   +-----------------+   +-----------------+
```

---

## 📁 Repository Structure

```text
Value Cars/
├── .github/workflows/       # GitHub Actions CI/CD workflows
├── backend/                 # FastAPI REST API backend
│   ├── app/
│   │   ├── api/v1/          # Modular API endpoints (auth, cars, inspections, etc.)
│   │   ├── core/            # Config, database connections, JWT security
│   │   ├── models/          # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/         # Pydantic v2 schemas / DTOs
│   │   ├── services/        # Business logic & valuation engine
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Pytest test suite
│   ├── Dockerfile           # Backend container definition
│   └── requirements.txt     # Python dependencies
├── frontend/                # Next.js 14 Frontend (Customer & Admin)
├── docker-compose.yml       # Local PostgreSQL + Redis + Backend stack
├── .gitignore               # Clean Git ignore rules
└── README.md                # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ (for frontend)
- Docker & Docker Compose (optional for containerized setup)

### 1. Backend Local Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Interactive API Docs (Swagger UI)**: `http://localhost:8000/docs`
- **Alternative Redoc API Docs**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/api/v1/health`

### 2. Run with Docker Compose

```bash
# Start PostgreSQL, Redis, and FastAPI Backend in one command
docker-compose up -d --build
```

---

## 🧪 Testing

```bash
cd backend
pytest
```

---

## 📄 License
MIT License. Built with clean architecture principles.
