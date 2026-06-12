# apps/users/email_service.py

import logging

from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


# ------------------------------------------------
# HELPER INTERNO
# ------------------------------------------------

def _enviar_email(
    asunto: str,
    mensaje: str,
    destinatario: str,
) -> bool:
    """
    Envía un email y captura errores sin romper
    el flujo principal de la aplicación.
    Retorna True si se envió correctamente.
    """
    try:
        send_mail(
            subject      = asunto,
            message      = mensaje,
            from_email   = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [destinatario],
            fail_silently  = False,
        )
        logger.info(f"Email enviado a {destinatario} — asunto: {asunto}")
        return True

    except Exception as e:
        logger.error(
            f"Error al enviar email a {destinatario} "
            f"— asunto: {asunto} — error: {e}"
        )
        return False


# ------------------------------------------------
# 1. VERIFICACIÓN DE EMAIL (PIN)
# ------------------------------------------------

def enviar_pin_verificacion(user, pin: str) -> bool:
    """
    Envía el PIN de 6 dígitos para verificar
    el email al momento del registro.
    """
    from configuracion.models import ConfiguracionSistema
    config = ConfiguracionSistema.obtener()

    asunto  = "Verificación de cuenta — ANH"
    mensaje = f"""
Hola {user.nombres},

Gracias por registrarte en el sistema de solicitudes de combustible de la
Agencia Nacional de Hidrocarburos (ANH).

Tu código de verificación es:

    {pin}

Este código expira en {config.tiempo_expiracion_pin_minutos} minutos.

Si no solicitaste este código, ignora este mensaje.

Agencia Nacional de Hidrocarburos
Bolivia
""".strip()

    return _enviar_email(asunto, mensaje, user.email)


# ------------------------------------------------
# 2. RECUPERACIÓN DE CONTRASEÑA (TOKEN UUID)
# ------------------------------------------------

def enviar_token_recuperacion(user, token_uuid: str) -> bool:
    """
    Envía el enlace con token UUID para
    recuperar la contraseña.
    """
    from configuracion.models import ConfiguracionSistema
    config = ConfiguracionSistema.obtener()

    # URL del frontend para recuperar contraseña
    frontend_url = getattr(
        settings,
        "FRONTEND_URL",
        "http://localhost:5173"
    )
    enlace = f"{frontend_url}/recuperar-password/confirmar?token={token_uuid}"

    asunto  = "Recuperación de contraseña — ANH"
    mensaje = f"""
Hola {user.nombres},

Recibimos una solicitud para restablecer la contraseña de tu cuenta
en el sistema ANH.

Haz clic en el siguiente enlace para crear una nueva contraseña:

    {enlace}

Este enlace expira en {config.tiempo_expiracion_token_recuperacion_horas} hora(s).

Si no solicitaste este cambio, ignora este mensaje.
Tu contraseña actual permanecerá sin cambios.

Agencia Nacional de Hidrocarburos
Bolivia
""".strip()

    return _enviar_email(asunto, mensaje, user.email)


# ------------------------------------------------
# 3. NOTIFICACIÓN — SOLICITUD APROBADA
# ------------------------------------------------

def enviar_notificacion_solicitud_aprobada(solicitud) -> bool:
    """
    Notifica al consumidor que su solicitud
    fue aprobada por la ANH.
    """
    user    = solicitud.consumidor.user
    asunto  = "Solicitud aprobada — ANH"
    mensaje = f"""
Hola {user.nombres},

Nos complace informarle que su solicitud de combustible ha sido APROBADA.

Detalles de la aprobación:
  - N° de solicitud : {str(solicitud.id_publico)[:8].upper()}
  - Combustible     : {solicitud.get_tipo_combustible_aprobado_display()}
  - Litros aprobados: {solicitud.litros_aprobados} L
  - Estación        : {solicitud.estacion_servicio.nombre}
  - Dirección       : {solicitud.estacion_servicio.direccion}, {solicitud.estacion_servicio.municipio}
  - Válida hasta    : {solicitud.fecha_expiracion.strftime("%d/%m/%Y %H:%M")}

Por favor, preséntese en la estación asignada antes de la fecha de vencimiento
con su documento de identidad.

Agencia Nacional de Hidrocarburos
Bolivia
""".strip()

    return _enviar_email(asunto, mensaje, user.email)


# ------------------------------------------------
# 4. NOTIFICACIÓN — SOLICITUD OBSERVADA
# ------------------------------------------------

def enviar_notificacion_solicitud_observada(solicitud) -> bool:
    """
    Notifica al consumidor que su solicitud
    fue observada y requiere atención.
    """
    user    = solicitud.consumidor.user
    asunto  = "Solicitud observada — ANH"
    mensaje = f"""
Hola {user.nombres},

Su solicitud de combustible ha sido OBSERVADA por la ANH
y requiere su atención.

Detalles:
  - N° de solicitud : {str(solicitud.id_publico)[:8].upper()}
  - Observación     : {solicitud.observacion_anh}

Por favor, revise la observación e ingrese al sistema para
corregir o complementar su solicitud.

Agencia Nacional de Hidrocarburos
Bolivia
""".strip()

    return _enviar_email(asunto, mensaje, user.email)


# ------------------------------------------------
# 5. NOTIFICACIÓN — SOLICITUD RECHAZADA
# ------------------------------------------------

def enviar_notificacion_solicitud_rechazada(solicitud) -> bool:
    """
    Notifica al consumidor que su solicitud
    fue rechazada por la ANH.
    """
    user    = solicitud.consumidor.user
    asunto  = "Solicitud rechazada — ANH"
    mensaje = f"""
Hola {user.nombres},

Lamentamos informarle que su solicitud de combustible ha sido RECHAZADA.

Detalles:
  - N° de solicitud : {str(solicitud.id_publico)[:8].upper()}
  - Motivo          : {solicitud.observacion_anh}

Si considera que existe un error, puede comunicarse con la
Agencia Nacional de Hidrocarburos para más información.

Agencia Nacional de Hidrocarburos
Bolivia
""".strip()

    return _enviar_email(asunto, mensaje, user.email)