from django.urls import path, include
from .views import ConsumidorPerfilView
from rest_framework.routers import DefaultRouter
from .views import ConsumidorAdminViewSet, ConsumidorPerfilView

#router = DefaultRouter()
router = DefaultRouter()
router.register("admin/consumidores", ConsumidorAdminViewSet, basename="consumidor-admin")

urlpatterns = [
    path('perfil/', ConsumidorPerfilView.as_view(), name='perfil-consumidor'),
    path("", include(router.urls)),
]

