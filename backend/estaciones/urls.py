# apps/estaciones/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import EstacionServicioViewSet


router = DefaultRouter()

router.register(
    r"estaciones",
    EstacionServicioViewSet,
    basename="estacion"
)

urlpatterns = [
    path("", include(router.urls)),
]