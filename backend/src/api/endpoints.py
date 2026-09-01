import fastapi

from src.api.routes.account import router as account_router
from src.api.routes.authentication import router as auth_router
from src.api.routes.project import router as project_router
from src.api.routes.project_scurve import router as project_scurve_router
from src.api.routes.mit import router as mit_router
from src.api.routes.hazid import router as hazid_router
from src.api.routes.hazop import router as hazop_router
from src.api.routes.lopa import router as lopa_router
from src.api.routes.moc import router as moc_router
from src.api.routes.produksi import router as produksi_router
from src.api.routes.location import router as location_router
from src.api.routes.zona_indicator import router as zona_indicator_router
from src.api.routes.zona_pse_list import router as zona_pse_list_router
from src.api.routes.hsse import router as hsse_router
from src.api.routes.airms import router as airms_router
from src.api.routes.i2aims import router as i2aims_router
from src.api.routes.lcv import router as lcv_router
from src.api.routes.dashboard import router as dashboard_router

router = fastapi.APIRouter()

router.include_router(router=account_router)
router.include_router(router=auth_router)
router.include_router(router=project_router)
router.include_router(router=project_scurve_router)
router.include_router(router=mit_router)
router.include_router(router=hazid_router)
router.include_router(router=hazop_router)
router.include_router(router=lopa_router)
router.include_router(router=moc_router)
router.include_router(router=produksi_router)
router.include_router(router=location_router)
router.include_router(router=zona_indicator_router)
router.include_router(router=zona_pse_list_router)
router.include_router(router=hsse_router)
router.include_router(router=airms_router)
router.include_router(router=i2aims_router)
router.include_router(router=lcv_router)
router.include_router(router=dashboard_router)



