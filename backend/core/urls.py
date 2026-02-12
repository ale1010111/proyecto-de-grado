"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Panel de Administración
    path('admin/', admin.site.urls),

    # Rutas de la API de Usuarios (Login, Registro, Estaciones)
    # Esto prefija todo con 'api/'. Ej: localhost:8000/api/users/
    path('api/', include('users.urls')),

    # Rutas de la API de Solicitudes (Cuando crees el archivo urls.py en esa app)
    # path('api/', include('solicitudes.urls')), 
]

# Configuración para servir archivos multimedia (imágenes) en modo DEBUG
# Sin esto, Django no mostrará las fotos subidas por los usuarios
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
