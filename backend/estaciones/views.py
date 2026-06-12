# apps/estaciones/views.py

from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter, SearchFilter

from django.core.exceptions import ValidationError as DjangoValidationError
from django_filters.rest_framework import DjangoFilterBackend

from users.permissions import IsAdminOrANH

from .models import EstacionServicio
from .serializers import (
    EstacionServicioReadSerializer,
    EstacionServicioListSerializer,
    EstacionServicioWriteSerializer,
    EstacionCambiarEstadoSerializer,
)


class EstacionServicioViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    API para gestionar estaciones de servicio.

    Acciones disponibles:
      - list           : ADMIN, ANH y ESS (solo su estación)
      - retrieve       : ADMIN, ANH y ESS (solo su estación)
      - create         : solo ADMIN y ANH
      - update         : solo ADMIN y ANH
      - cambiar_estado : solo ADMIN y ANH

    Acciones NO disponibles:
      - destroy : las estaciones no se eliminan físicamente,
                  se desactivan via cambiar_estado
    """

    permission_classes = [IsAuthenticated]

    # ------------------------------------------------
    # FILTROS
    # ------------------------------------------------

    filter_backends = [
        DjangoFilterBackend,
        OrderingFilter,
        SearchFilter,
    ]

    filterset_fields  = ["estado", "departamento", "municipio"]
    ordering_fields   = ["nombre", "codigo", "departamento", "fecha_creacion"]
    ordering          = ["departamento", "nombre"]
    search_fields     = ["nombre", "codigo", "municipio", "departamento"]

    # ------------------------------------------------
    # QUERYSET SEGÚN ROL
    # ------------------------------------------------

    def get_queryset(self):
        user = self.request.user

        base_qs = EstacionServicio.objects.select_related(
            "creada_por"
        ).prefetch_related(
            "funcionarios__user"
        )

        # ADMIN y ANH ven todas las estaciones
        if user.tipo_usuario in ["ADMIN", "ANH"]:
            return base_qs

        # ESS solo ve su estación asignada via PerfilFuncionario
        if (
            user.tipo_usuario == "ESS"
            and hasattr(user, "perfil_funcionario")
            and user.perfil_funcionario.estacion_servicio
        ):
            return base_qs.filter(
                pk=user.perfil_funcionario.estacion_servicio.pk
            )

        return base_qs.none()

    # ------------------------------------------------
    # SERIALIZER DINÁMICO
    # ------------------------------------------------

    def get_serializer_class(self):

        if self.action == "list":
            return EstacionServicioListSerializer

        if self.action in ("create", "update", "partial_update"):
            return EstacionServicioWriteSerializer

        if self.action == "cambiar_estado":
            return EstacionCambiarEstadoSerializer

        return EstacionServicioReadSerializer

    # ------------------------------------------------
    # PERMISOS DINÁMICOS
    # ------------------------------------------------

    def get_permissions(self):

        if self.action in ("create", "update", "partial_update", "cambiar_estado"):
            return [IsAuthenticated(), IsAdminOrANH()]

        return [IsAuthenticated()]

    # ------------------------------------------------
    # CREAR ESTACIÓN
    # ------------------------------------------------

    def perform_create(self, serializer):
        serializer.save(creada_por=self.request.user)

    # ------------------------------------------------
    # CAMBIAR ESTADO (ACTIVA / INACTIVA / SUSPENDIDA)
    # Reemplaza el destroy — las estaciones no se
    # eliminan físicamente, solo cambian de estado.
    # ------------------------------------------------

    @action(detail=True, methods=["post"], url_path="cambiar-estado")
    def cambiar_estado(self, request, pk=None):

        estacion = self.get_object()
        self.check_object_permissions(request, estacion)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        estado_anterior = estacion.estado
        estado_nuevo    = serializer.validated_data["estado"]

        if estado_anterior == estado_nuevo:
            return Response(
                {
                    "detail": (
                        f"La estación ya se encuentra en estado "
                        f"{estacion.get_estado_display()}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        estacion.estado = estado_nuevo
        estacion.save(update_fields=["estado", "fecha_actualizacion"])

        return Response(
            EstacionServicioReadSerializer(estacion).data,
            status=status.HTTP_200_OK
        )