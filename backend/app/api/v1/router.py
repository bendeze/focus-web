from fastapi import APIRouter
from app.api.v1 import auth, focus, projects, tasks, admin

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(focus.router)
api_router.include_router(admin.router)
