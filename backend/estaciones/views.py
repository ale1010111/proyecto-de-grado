from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.exceptions import PermissionDenied

from users.permissions import IsAdminOrANH, IsEstacionServicio
from .models import EstacionServicio
from .serializers import (
    EstacionServicioReadSerializer,
    EstacionServicioWriteSerializer
)


class EstacionServicioViewSet(ModelViewSet):

    permission_classes = [IsAuthenticated]

    # =========================
    # Queryset seguro
    # =========================
    def get_queryset(self):
        user = self.request.user

        if user.tipo_usuario in ["ADMIN", "ANH"]:
            return EstacionServicio.objects.all()

        if user.tipo_usuario == "ESS":
            return EstacionServicio.objects.filter(usuario=user)

        return EstacionServicio.objects.none()

    # =========================
    # Serializer dinámico
    # =========================
    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return EstacionServicioReadSerializer
        return EstacionServicioWriteSerializer

    # =========================
    # Permisos por acción
    # =========================
    def get_permissions(self):

        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]

        return [IsAuthenticated(), IsAdminOrANH()]

    # =========================
    # Seguridad adicional
    # =========================
    def perform_create(self, serializer):
        user = self.request.user

        if user.tipo_usuario not in ["ADMIN", "ANH"]:
            raise PermissionDenied("No tiene permisos para crear estaciones.")

        serializer.save(creada_por=user)

    def perform_update(self, serializer):
        user = self.request.user

        if user.tipo_usuario not in ["ADMIN", "ANH"]:
            raise PermissionDenied("No tiene permisos para modificar estaciones.")

        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user

        if user.tipo_usuario not in ["ADMIN", "ANH"]:
            raise PermissionDenied("No tiene permisos para eliminar estaciones.")

        instance.delete()
