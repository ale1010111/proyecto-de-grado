from django.urls import path
from .views import ConsumidorPerfilView

urlpatterns = [
    path('perfil/', ConsumidorPerfilView.as_view(), name='perfil-consumidor'),
]
