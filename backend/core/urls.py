from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from users.views import LoginView, RefreshView, LogoutView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # 🔐 JWT Authentication
    path('api/login/', LoginView.as_view()),
    path('api/refresh/', RefreshView.as_view()),
    path('api/logout/', LogoutView.as_view()),

    # Apps
    path('api/', include('users.urls')),
    path('api/consumidor/', include('consumidores.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
