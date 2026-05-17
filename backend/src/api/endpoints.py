import fastapi

from src.api.routes.account import router as account_router
from src.api.routes.authentication import router as auth_router
from src.api.routes.project import router as project_router
from src.api.routes.mit import router as mit_router
from src.api.routes.hazid import router as hazid_router
from src.api.routes.hazop import router as hazop_router
from src.api.routes.lopa import router as lopa_router
from src.api.routes.location import router as location_router

router = fastapi.APIRouter()

router.include_router(router=account_router)
router.include_router(router=auth_router)
router.include_router(router=project_router)
router.include_router(router=mit_router)
router.include_router(router=hazid_router)
router.include_router(router=hazop_router)
router.include_router(router=lopa_router)
router.include_router(router=location_router)
