# apps/solicitudes/services/aprobar_solicitud.py

from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from solicitudes.models import Solicitud
from configuracion.models import ConfiguracionSistema


def aprobar_solicitud(
    solicitud_id: int,
    usuario_aprobador,
    estacion_servicio,
    litros_aprobados: int,
    tipo_combustible_aprobado: str,
    observacion_anh: str = "",
) -> Solicitud:

    with transaction.atomic():

        # Bloquea la fila para evitar condiciones de carrera
        solicitud = (
            Solicitud.objects
            .select_for_update()
            .select_related("consumidor")
            .get(id=solicitud_id)
        )

        # -----------------------------------------
        # Validar identidad del consumidor
        # -----------------------------------------

        consumidor = solicitud.consumidor
        if consumidor.estado_identidad != "VERIFICADO":
            raise ValidationError(
                f"No se puede aprobar la solicitud. El consumidor "
                f"'{consumidor.user.nombre_completo()}' no tiene su identidad "
                f"verificada. Estado actual: "
                f"{consumidor.get_estado_identidad_display()}. "
                f"Verifique los documentos antes de aprobar."
            )

        # Validar que el consumidor no esté bloqueado
        if consumidor.esta_bloqueado():
            raise ValidationError(
                f"No se puede aprobar la solicitud. El consumidor "
                f"'{consumidor.user.nombre_completo()}' está bloqueado "
                f"por alerta de repetitividad."
            )

        # -----------------------------------------
        # Validar estado actual
        # -----------------------------------------

        if solicitud.estado not in [
            Solicitud.EstadoSolicitud.PENDIENTE,
            Solicitud.EstadoSolicitud.OBSERVADA,
        ]:
            raise ValidationError(
                "Solo se pueden aprobar solicitudes pendientes u observadas."
            )

        # -----------------------------------------
        # Obtener configuración del sistema
        # -----------------------------------------

        # Obtener configuración — siempre existe gracias a get_or_create
        config = ConfiguracionSistema.obtener()

        # -----------------------------------------
        # Calcular expiración desde configuración
        # -----------------------------------------

        now = timezone.now()

        fecha_expiracion = now + timezone.timedelta(
            hours=config.tiempo_expiracion_solicitudes_horas
        )

        # -----------------------------------------
        # Registrar aprobación
        # -----------------------------------------

        solicitud.estado                   = Solicitud.EstadoSolicitud.APROBADA
        solicitud.tipo_combustible_aprobado = tipo_combustible_aprobado
        solicitud.litros_aprobados          = litros_aprobados
        solicitud.estacion_servicio         = estacion_servicio
        solicitud.observacion_anh           = observacion_anh

        # Auditoría — ambos campos apuntan al mismo usuario aprobador
        solicitud.aprobado_por              = usuario_aprobador
        solicitud.estacion_asignada_por     = usuario_aprobador

        # Fechas — un solo now() para consistencia
        solicitud.fecha_aprobacion          = now
        solicitud.fecha_asignacion_estacion = now
        solicitud.fecha_expiracion          = fecha_expiracion

        solicitud.full_clean()
        solicitud.save()

        # Registrar auditoría
        from .registrar_auditoria import registrar_cambio_estado
        registrar_cambio_estado(
            solicitud=solicitud,
            estado_anterior=Solicitud.EstadoSolicitud.PENDIENTE,
            estado_nuevo=Solicitud.EstadoSolicitud.APROBADA,
            usuario=usuario_aprobador,
            nota=observacion_anh,
        )

        # Notificar al consumidor
        from users.email_service import enviar_notificacion_solicitud_aprobada
        enviar_notificacion_solicitud_aprobada(solicitud)

        return solicitud