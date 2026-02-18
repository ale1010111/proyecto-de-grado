from rest_framework.routers import DefaultRouter
from .views import EstacionServicioViewSet

router = DefaultRouter()
router.register("estaciones", EstacionServicioViewSet, basename="estaciones")

urlpatterns = router.urls
