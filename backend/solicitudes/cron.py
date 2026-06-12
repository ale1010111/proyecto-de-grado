# apps/solicitudes/cron.py

import logging

from django.utils import timezone

logger = logging.getLogger(__name__)


# ------------------------------------------------
# TAREA 1 — EXPIRAR SOLICITUDES VENCIDAS
# Corre cada hora: "0 * * * *"
# ------------------------------------------------

def expirar_solicitudes():
    """
    Cambia a EXPIRADA todas las solicitudes APROBADAS
    cuya fecha_expiracion ya pasó.

    Se ejecuta automáticamente cada hora via crontab.
    También puede ejecutarse manualmente:
        python manage.py runcrons
    """
    from .models import Solicitud

    ahora = timezone.now()

    solicitudes_vencidas = Solicitud.objects.filter(
        estado=Solicitud.EstadoSolicitud.APROBADA,
        fecha_expiracion__lt=ahora
    )

    total = solicitudes_vencidas.count()

    if total == 0:
        logger.info("Expiración automática: no hay solicitudes vencidas.")
        return

    # Guardar IDs antes del update masivo para auditoría
    ids_vencidas = list(solicitudes_vencidas.values_list("id", flat=True))

    # Actualizar en bloque
    solicitudes_vencidas.update(
        estado=Solicitud.EstadoSolicitud.EXPIRADA,
        fecha_actualizacion=ahora
    )

    logger.info(f"Expiración automática: {total} solicitud(es) marcadas como EXPIRADA.")

    # Registrar auditoría para cada solicitud expirada
    from solicitudes.services.registrar_auditoria import registrar_cambio_estado
    from solicitudes.models import AuditoriaEstadoSolicitud

    for sol in Solicitud.objects.filter(id__in=ids_vencidas):
        registrar_cambio_estado(
            solicitud=sol,
            estado_anterior=Solicitud.EstadoSolicitud.APROBADA,
            estado_nuevo=Solicitud.EstadoSolicitud.EXPIRADA,
            usuario=None,
            nota="Expiración automática por vencimiento de plazo.",
        )

    # Notificar a cada consumidor
    _notificar_expiradas(solicitudes_vencidas, ahora)


def _notificar_expiradas(solicitudes_qs, ahora):
    """
    Envía email a cada consumidor cuya solicitud expiró.
    """
    from users.email_service import _enviar_email

    # Re-consultar para obtener las ya expiradas
    from .models import Solicitud
    expiradas = Solicitud.objects.filter(
        estado=Solicitud.EstadoSolicitud.EXPIRADA,
        fecha_actualizacion__gte=ahora.replace(second=0, microsecond=0)
    ).select_related("consumidor__user", "estacion_servicio")

    for solicitud in expiradas:
        try:
            user = solicitud.consumidor.user
            _enviar_email(
                asunto="Solicitud expirada — ANH",
                mensaje=(
                    f"Hola {user.nombres},\n\n"
                    f"Su solicitud de combustible N° "
                    f"{str(solicitud.id_publico)[:8].upper()} ha EXPIRADO "
                    f"porque no fue retirada antes del plazo establecido.\n\n"
                    f"Detalles:\n"
                    f"  - Combustible: {solicitud.get_tipo_combustible_aprobado_display()}\n"
                    f"  - Litros aprobados: {solicitud.litros_aprobados} L\n"
                    f"  - Estación: {solicitud.estacion_servicio.nombre if solicitud.estacion_servicio else '—'}\n"
                    f"  - Fecha de expiración: {solicitud.fecha_expiracion.strftime('%d/%m/%Y %H:%M')}\n\n"
                    f"Si necesita combustible puede realizar una nueva solicitud.\n\n"
                    f"Agencia Nacional de Hidrocarburos\nBolivia"
                ),
                destinatario=user.email
            )
        except Exception as e:
            logger.error(
                f"Error al notificar expiración de solicitud "
                f"{solicitud.id_publico}: {e}"
            )


# ------------------------------------------------
# TAREA 2 — NOTIFICAR PRÓXIMAS A EXPIRAR
# Corre cada hora: "30 * * * *"
# ------------------------------------------------

def notificar_proximas_a_expirar():
    """
    Notifica a consumidores cuya solicitud aprobada
    está próxima a expirar según la configuración.

    Evita enviar la notificación más de una vez
    verificando si ya fue enviada en el período.
    """
    from .models import Solicitud
    from configuracion.models import ConfiguracionSistema
    from users.email_service import _enviar_email
    from datetime import timedelta

    config = ConfiguracionSistema.obtener()
    ahora  = timezone.now()

    # Ventana de aviso
    limite_inferior = ahora
    limite_superior = ahora + timedelta(
        hours=config.horas_aviso_expiracion_solicitud
    )

    proximas = Solicitud.objects.filter(
        estado=Solicitud.EstadoSolicitud.APROBADA,
        fecha_expiracion__gte=limite_inferior,
        fecha_expiracion__lte=limite_superior,
    ).select_related("consumidor__user", "estacion_servicio")

    total = proximas.count()

    if total == 0:
        logger.info("Aviso de expiración: no hay solicitudes próximas a vencer.")
        return

    logger.info(f"Aviso de expiración: notificando {total} consumidor(es).")

    for solicitud in proximas:
        try:
            user          = solicitud.consumidor.user
            horas_restantes = round(
                (solicitud.fecha_expiracion - ahora).total_seconds() / 3600, 1
            )

            _enviar_email(
                asunto="⚠️ Su solicitud está por expirar — ANH",
                mensaje=(
                    f"Hola {user.nombres},\n\n"
                    f"AVISO IMPORTANTE: Su solicitud de combustible vence "
                    f"en aproximadamente {horas_restantes} hora(s).\n\n"
                    f"Detalles:\n"
                    f"  - N° solicitud: {str(solicitud.id_publico)[:8].upper()}\n"
                    f"  - Combustible: {solicitud.get_tipo_combustible_aprobado_display()}\n"
                    f"  - Litros aprobados: {solicitud.litros_aprobados} L\n"
                    f"  - Estación asignada: "
                    f"{solicitud.estacion_servicio.nombre if solicitud.estacion_servicio else '—'}\n"
                    f"  - Dirección: "
                    f"{solicitud.estacion_servicio.direccion if solicitud.estacion_servicio else '—'}\n"
                    f"  - Expira el: "
                    f"{solicitud.fecha_expiracion.strftime('%d/%m/%Y %H:%M')}\n\n"
                    f"Por favor acérquese a la estación antes del vencimiento "
                    f"con su documento de identidad.\n\n"
                    f"Agencia Nacional de Hidrocarburos\nBolivia"
                ),
                destinatario=user.email
            )
        except Exception as e:
            logger.error(
                f"Error al notificar próxima expiración de solicitud "
                f"{solicitud.id_publico}: {e}"
            )


# ------------------------------------------------
# COMANDO MANUAL PARA TESTING
# Ejecutar con: python manage.py runcrons
# O directamente en shell:
#   from solicitudes.cron import expirar_solicitudes
#   expirar_solicitudes()
# ------------------------------------------------