# apps/solicitudes/filters.py

import django_filters
from .models import Solicitud


class SolicitudFilter(django_filters.FilterSet):

    # ------------------------------------------------
    # ESTADO
    # Acepta múltiples valores: ?estado=PENDIENTE&estado=OBSERVADA
    # ------------------------------------------------

    estado = django_filters.MultipleChoiceFilter(
        choices=Solicitud.EstadoSolicitud.choices
    )

    # ------------------------------------------------
    # TIPO DE COMBUSTIBLE
    # ------------------------------------------------

    tipo_combustible = django_filters.ChoiceFilter(
        choices=Solicitud.TipoCombustible.choices
    )

    # ------------------------------------------------
    # RELACIONES
    # Solo útiles para ANH. get_queryset() en la vista
    # garantiza que cada rol solo vea lo que le corresponde.
    # ------------------------------------------------

    consumidor = django_filters.NumberFilter(
        field_name="consumidor_id"
    )

    estacion_servicio = django_filters.NumberFilter(
        field_name="estacion_servicio_id"
    )

    # ------------------------------------------------
    # RANGO POR FECHA DE CREACIÓN
    # DateFilter es más permisivo que DateTimeFilter:
    # acepta ?fecha_desde=2025-01-01 sin necesidad de hora.
    # ------------------------------------------------

    fecha_desde = django_filters.DateFilter(
        field_name="fecha_creacion",
        lookup_expr="date__gte"
    )

    fecha_hasta = django_filters.DateFilter(
        field_name="fecha_creacion",
        lookup_expr="date__lte"
    )

    # ------------------------------------------------
    # RANGO POR FECHA DE APROBACIÓN
    # Útil para reportes ANH: "aprobadas esta semana"
    # ------------------------------------------------

    aprobacion_desde = django_filters.DateFilter(
        field_name="fecha_aprobacion",
        lookup_expr="date__gte"
    )

    aprobacion_hasta = django_filters.DateFilter(
        field_name="fecha_aprobacion",
        lookup_expr="date__lte"
    )

    # ------------------------------------------------
    # RANGO POR FECHA DE DESPACHO
    # Útil para estaciones: "despachos del día"
    # ------------------------------------------------

    despacho_desde = django_filters.DateFilter(
        field_name="fecha_despacho",
        lookup_expr="date__gte"
    )

    despacho_hasta = django_filters.DateFilter(
        field_name="fecha_despacho",
        lookup_expr="date__lte"
    )

    class Meta:
        model = Solicitud
        fields = [
            "estado",
            "tipo_combustible",
            "consumidor",
            "estacion_servicio",
            "fecha_desde",
            "fecha_hasta",
            "aprobacion_desde",
            "aprobacion_hasta",
            "despacho_desde",
            "despacho_hasta",
        ]