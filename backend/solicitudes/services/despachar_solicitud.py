# apps/solicitudes/services/despachar_solicitud.py

from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from solicitudes.models import Solicitud


def despachar_solicitud(
    solicitud: Solicitud,
    usuario,
    litros_despachados: int,
    observacion: str = "",
) -> Solicitud:

    with transaction.atomic():

        # Bloquea la fila para evitar condiciones de carrera
        solicitud = (
        Solicitud.objects
        .select_for_update()
        .get(id=solicitud.id)
        )

        # -----------------------------------------
        # Validar estado actual
        # -----------------------------------------

        if solicitud.estado != Solicitud.EstadoSolicitud.APROBADA:
            raise ValidationError(
                "Solo se pueden despachar solicitudes aprobadas."
            )

        # -----------------------------------------
        # Validar que no haya expirado
        # -----------------------------------------

        if solicitud.fecha_expiracion and timezone.now() > solicitud.fecha_expiracion:
            raise ValidationError(
                "La solicitud ha expirado y no puede ser despachada."
            )

        # -----------------------------------------
        # Validar litros despachados
        # -----------------------------------------

        if litros_despachados <= 0:
            raise ValidationError(
                "Los litros despachados deben ser mayores a 0."
            )

        if litros_despachados > solicitud.litros_aprobados:
            raise ValidationError(
                f"No se pueden despachar más litros de los aprobados "
                f"({solicitud.litros_aprobados} L)."
            )

        # -----------------------------------------
        # Registrar despacho
        # -----------------------------------------

        now = timezone.now()

        solicitud.estado             = Solicitud.EstadoSolicitud.DESPACHADA
        solicitud.litros_despachados = litros_despachados  # Real entregado
        solicitud.observacion_anh    = observacion
        solicitud.despachado_por     = usuario
        solicitud.fecha_despacho     = now

        # litros_aprobados se preserva intacto para trazabilidad

        solicitud.full_clean()
        solicitud.save()

        # Verificar repetitividad tras cada despacho
        try:
            from .verificar_repetitividad import verificar_repetitividad
            verificar_repetitividad(solicitud)
        except Exception as e:
            # No romper el despacho si falla la verificación
            import logging
            logging.getLogger(__name__).error(
                f"Error en verificación de repetitividad: {e}"
            )

        return solicitud