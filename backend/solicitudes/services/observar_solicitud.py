# apps/solicitudes/services/observar_solicitud.py

from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import timedelta

from solicitudes.models import Solicitud


def observar_solicitud(
    solicitud: Solicitud,
    usuario,
    observacion_anh: str,
) -> Solicitud:

    with transaction.atomic():

        # Bloquear fila — sin select_related para evitar outer join
        solicitud = (
            Solicitud.objects
            .select_for_update()
            .get(id=solicitud.id)
        )

        # -----------------------------------------
        # Validar estado actual
        # -----------------------------------------

        if solicitud.estado != Solicitud.EstadoSolicitud.PENDIENTE:
            raise ValidationError(
                "Solo se pueden observar solicitudes en estado pendiente."
            )

        # -----------------------------------------
        # Registrar observación con plazo de 24h
        # -----------------------------------------

        ahora = timezone.now()

        solicitud.estado                = Solicitud.EstadoSolicitud.OBSERVADA
        solicitud.observacion_anh       = observacion_anh
        solicitud.fecha_revision        = ahora
        solicitud.fecha_observacion     = ahora
        solicitud.fecha_limite_respuesta = ahora + timedelta(hours=24)

        # Limpiar respuesta anterior si hubiese
        solicitud.respuesta_consumidor  = ""

        solicitud.full_clean()
        solicitud.save()

        # Registrar auditoría
        from solicitudes.services.registrar_auditoria import registrar_cambio_estado
        registrar_cambio_estado(
            solicitud   = solicitud,
            estado_anterior = Solicitud.EstadoSolicitud.PENDIENTE,
            estado_nuevo    = Solicitud.EstadoSolicitud.OBSERVADA,
            usuario         = usuario,
            nota            = f"Observación: {observacion_anh}",
        )

        # Notificar al consumidor
        from users.email_service import enviar_notificacion_solicitud_observada
        enviar_notificacion_solicitud_observada(solicitud)

        return solicitud


def responder_observacion(
    solicitud: Solicitud,
    usuario,
    respuesta: str,
    documento=None,
) -> Solicitud:
    """
    El consumidor responde la observación de la ANH.
    La solicitud vuelve a PENDIENTE para que la ANH la revise nuevamente.
    Solo funciona si el plazo de 24h no ha vencido.
    """

    with transaction.atomic():

        solicitud = (
            Solicitud.objects
            .select_for_update()
            .get(id=solicitud.id)
        )

        # -----------------------------------------
        # Validaciones
        # -----------------------------------------

        if solicitud.estado != Solicitud.EstadoSolicitud.OBSERVADA:
            raise ValidationError(
                "Solo se pueden responder solicitudes en estado observada."
            )

        if solicitud.respuesta_plazo_vencido:
            raise ValidationError(
                "El plazo de 24 horas para responder la observación ha vencido. "
                "La solicitud será rechazada automáticamente."
            )

        if not respuesta or len(respuesta.strip()) < 10:
            raise ValidationError(
                "La respuesta debe tener al menos 10 caracteres."
            )

        # -----------------------------------------
        # Registrar respuesta y volver a PENDIENTE
        # -----------------------------------------

        solicitud.respuesta_consumidor = respuesta.strip()
        solicitud.estado               = Solicitud.EstadoSolicitud.PENDIENTE
        solicitud.fecha_revision       = None  # Reset para nueva revisión

        # Guardar documento adjunto si se proporcionó
        if documento:
            solicitud.documento_respuesta = documento

        solicitud.full_clean()
        solicitud.save()

        # Registrar auditoría
        from solicitudes.services.registrar_auditoria import registrar_cambio_estado
        registrar_cambio_estado(
            solicitud       = solicitud,
            estado_anterior = Solicitud.EstadoSolicitud.OBSERVADA,
            estado_nuevo    = Solicitud.EstadoSolicitud.PENDIENTE,
            usuario         = usuario,
            nota            = f"Respuesta consumidor: {respuesta[:100]}",
        )

        return solicitud