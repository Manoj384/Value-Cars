from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.cars import router as cars_router
from app.api.v1.leads import router as leads_router
from app.api.v1.test_drives import router as test_drives_router
from app.api.v1.inspections import router as inspections_router
from app.api.v1.orders import router as orders_router
from app.api.v1.admin import router as admin_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.sellers import router as sellers_router

api_router = APIRouter()

api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & OTP"])
api_router.include_router(cars_router, prefix="/cars", tags=["Car Catalog & Search"])
api_router.include_router(leads_router, prefix="/leads", tags=["CRM & Valuation"])
api_router.include_router(test_drives_router, prefix="/test-drives", tags=["Test Drive Bookings"])
api_router.include_router(inspections_router, prefix="/inspections", tags=["Digital Inspection"])
api_router.include_router(orders_router, prefix="/orders", tags=["Reservations & Orders"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin Operations & Metrics"])
api_router.include_router(uploads_router, prefix="/uploads", tags=["Image Uploads"])
api_router.include_router(sellers_router, prefix="/sellers", tags=["Seller Portal"])
