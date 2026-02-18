from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from users.permissions import (
    IsAdminOrANH,
    IsEstacionServicio,
    IsConsumidor
)

from .models import Solicitud
from .serializers import (
    SolicitudReadSerializer,
    SolicitudWriteSerializer
)


class SolicitudViewSet(ModelViewSet):

    permission_classes = [IsAuthenticated]

    # =========================
    # Queryset seguro
    # =========================
    def get_queryset(self):
        user = self.request.user

        base_qs = Solicitud.objects.select_related(
            "consumidor__user",
            "estacion_servicio"
        )

        if user.tipo_usuario in ["ADMIN", "ANH"]:
            return base_qs

        if user.tipo_usuario == "ESS":
            return base_qs.filter(
                estacion_servicio=user.estacion
            )

        if user.tipo_usuario == "CONS":
            return base_qs.filter(
                consumidor__user=user
            )

        return Solicitud.objects.none()

    # =========================
    # Serializer dinámico
    # =========================
    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return SolicitudReadSerializer
        return SolicitudWriteSerializer

    # =========================
    # Permisos por acción
    # =========================
    def perform_create(self, serializer):
        user = self.request.user

        if user.tipo_usuario != "CONS":
            raise PermissionDenied("Solo consumidores pueden crear solicitudes.")

        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user

        if user.tipo_usuario not in ["ADMIN", "ANH", "ESS"]:
            raise PermissionDenied("No tiene permisos para modificar solicitudes.")

        serializer.save()

    def perform_destroy(self, instance):
        raise PermissionDenied("Las solicitudes no pueden eliminarse.")

    @action(detail=True, methods=["post"])
    def cambiar_estado(self, request, pk=None):

        solicitud = self.get_object()
        user = request.user
        nuevo_estado = request.data.get("estado")

        # =========================
        # Validar rol
        # =========================
        if user.tipo_usuario not in ["ADMIN", "ANH", "ESS"]:
            return Response(
                {"detail": "No tiene permisos para cambiar estado."},
                status=status.HTTP_403_FORBIDDEN
            )

        # ESS solo puede modificar solicitudes de su estación
        if user.tipo_usuario == "ESS":
            if solicitud.estacion_servicio.usuario != user:
                return Response(
                    {"detail": "No puede modificar solicitudes de otra estación."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # =========================
        # Validar transición
        # =========================
        if solicitud.estado != "PENDIENTE":
            return Response(
                {"detail": "Solo solicitudes pendientes pueden modificarse."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if nuevo_estado not in ["APROBADA", "RECHAZADA"]:
            return Response(
                {"detail": "Estado inválido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================
        # Aplicar cambio
        # =========================
        solicitud.estado = nuevo_estado
        solicitud.aprobado_por = user
        solicitud.save()

        return Response(
            {"detail": f"Solicitud {nuevo_estado.lower()} correctamente."},
            status=status.HTTP_200_OK
        )