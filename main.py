"""Value Cars root launcher.

Runs the FastAPI application directly using uvicorn.
"""
import os
import sys
import uvicorn

if __name__ == "__main__":
    # Add backend directory to python path
    backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

    print("🚀 Starting Value Cars API server on http://localhost:8000 ...")
    print("📖 Interactive Swagger API documentation: http://localhost:8000/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)