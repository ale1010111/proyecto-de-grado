# apps/consumidores/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    MiPerfilConsumidorView,
    MisDocumentosView,
    ConsumidorPerfilViewSet,
)


router = DefaultRouter()

router.register(
    r"consumidores",
    ConsumidorPerfilViewSet,
    basename="consumidor"
)

urlpatterns = [

    # ------------------------------------------------
    # CONSUMIDOR AUTENTICADO (CONS)
    # ------------------------------------------------

    path(
        "consumidores/me/",
        MiPerfilConsumidorView.as_view(),
        name="mi-perfil-consumidor"
    ),

    path(
        "consumidores/me/documentos/",
        MisDocumentosView.as_view(),
        name="mis-documentos"
    ),

    # ------------------------------------------------
    # GESTIÓN ANH (ViewSet)
    # Genera:
    #   GET  /consumidores/
    #   GET  /consumidores/{id}/
    #   POST /consumidores/{id}/verificar/
    #   POST /consumidores/{id}/alerta/
    # ------------------------------------------------

    path("", include(router.urls)),
]