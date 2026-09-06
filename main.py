"""Value Cars root launcher.

Runs the FastAPI application directly using uvicorn.
Configured safely for Windows command prompt and PowerShell.
"""
import os
import sys

# Configure UTF-8 safe stdout for Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import uvicorn

if __name__ == "__main__":
    # Add backend directory to python path
    backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    if backend_path not in sys.path:
        sys.path.insert(0, backend_path)

    print("================================================================")
    print(" Value Cars Platform Server is Starting...")
    print(" Web Marketplace UI : http://localhost:8000")
    print(" Swagger API Docs   : http://localhost:8000/docs")
    print(" Admin Approval Hub : http://localhost:8000 (Click Admin Portal)")
    print("================================================================")

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)