from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, EstacionServicioViewSet

# El Router crea las URLs automáticamente por ti
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'estaciones', EstacionServicioViewSet, basename='estacion')

urlpatterns = [
    path('', include(router.urls)),
]