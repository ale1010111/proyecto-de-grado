# apps/solicitudes/services/registrar_auditoria.py

import logging

logger = logging.getLogger(__name__)


def registrar_cambio_estado(
    solicitud,
    estado_anterior: str,
    estado_nuevo: str,
    usuario=None,
    request=None,
    nota: str = ""
) -> None:
    """
    Registra un cambio de estado en la auditoría de solicitudes.

    Se llama automáticamente desde cada servicio que
    cambia el estado de una solicitud:
    - aprobar_solicitud
    - observar_solicitud
    - rechazar_solicitud
    - despachar_solicitud
    - cancelar (en la vista)
    - expirar_solicitudes (cron)

    Args:
        solicitud     : instancia de Solicitud
        estado_anterior: estado antes del cambio
        estado_nuevo  : estado después del cambio
        usuario       : User que realizó el cambio (None para cron)
        request       : request HTTP para extraer IP (opcional)
        nota          : nota adicional sobre el cambio
    """
    from solicitudes.models import AuditoriaEstadoSolicitud

    try:
        ip_address = None
        if request:
            ip_address = _get_ip(request)

        AuditoriaEstadoSolicitud.objects.create(
            solicitud       = solicitud,
            estado_anterior = estado_anterior,
            estado_nuevo    = estado_nuevo,
            usuario         = usuario,
            ip_address      = ip_address,
            nota            = nota,
        )

        logger.info(
            f"Auditoría: Solicitud {str(solicitud.id_publico)[:8].upper()} "
            f"{estado_anterior} → {estado_nuevo} "
            f"por {usuario.email if usuario else 'sistema'}"
        )

    except Exception as e:
        # El fallo en auditoría no debe romper el flujo principal
        logger.error(f"Error al registrar auditoría: {e}")


def _get_ip(request) -> str:
    """
    Obtiene la IP real del cliente considerando proxies.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")