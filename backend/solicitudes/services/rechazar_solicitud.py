# apps/solicitudes/services/rechazar_solicitud.py

from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from solicitudes.models import Solicitud


def rechazar_solicitud(
    solicitud: Solicitud,
    usuario,
    observacion_anh: str,
) -> Solicitud:

    with transaction.atomic():

        # Bloquea la fila para evitar condiciones de carrera
        solicitud = (
            Solicitud.objects
            .select_for_update()
            .select_related("consumidor")
            .get(id=solicitud.id)
        )

        # -----------------------------------------
        # Validar estado actual
        # -----------------------------------------

        if solicitud.estado not in [
            Solicitud.EstadoSolicitud.PENDIENTE,
            Solicitud.EstadoSolicitud.OBSERVADA,
        ]:
            raise ValidationError(
                "Solo se pueden rechazar solicitudes pendientes u observadas."
            )

        # -----------------------------------------
        # Registrar rechazo
        # -----------------------------------------

        solicitud.estado          = Solicitud.EstadoSolicitud.RECHAZADA
        solicitud.observacion_anh = observacion_anh
        solicitud.fecha_revision  = timezone.now()

        solicitud.full_clean()
        solicitud.save()

        # Notificar al consumidor
        from users.email_service import enviar_notificacion_solicitud_rechazada
        enviar_notificacion_solicitud_rechazada(solicitud)

        return solicitud