"""
URL configuration for core project.
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