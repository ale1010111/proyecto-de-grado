# apps/users/services.py

import secrets
from datetime import timedelta

from django.utils import timezone

from .models import TokenVerificacion


# ------------------------------------------------
# SERVICIO: CREAR TOKEN DE VERIFICACIÓN
# ------------------------------------------------

def crear_token_verificacion(user, tipo: str) -> TokenVerificacion:
    """
    Crea un token de verificación de un solo uso.

    - Invalida tokens anteriores del mismo tipo.
    - Genera un PIN de 6 dígitos criptográficamente seguro.
    - La expiración se lee desde ConfiguracionSistema
      para que el administrador pueda ajustarla sin
      tocar código.

    Retorna el objeto TokenVerificacion creado.
    El PIN está disponible en token.codigo_pin.
    """

    # Import tardío para evitar circular imports
    from configuracion.models import ConfiguracionSistema

    config = ConfiguracionSistema.obtener()

    # Invalidar tokens anteriores del mismo tipo
    TokenVerificacion.objects.filter(
        user=user,
        tipo=tipo,
        usado=False,
    ).update(usado=True)

    # Generar PIN criptográficamente seguro
    pin = str(secrets.randbelow(900000) + 100000)

    # Calcular expiración según tipo y configuración
    if tipo == TokenVerificacion.TipoToken.VERIFICACION_EMAIL:
        expiracion = timezone.now() + timedelta(
            minutes=config.tiempo_expiracion_pin_minutos
        )
    else:
        expiracion = timezone.now() + timedelta(
            hours=config.tiempo_expiracion_token_recuperacion_horas
        )

    return TokenVerificacion.objects.create(
        user             = user,
        tipo             = tipo,
        codigo_pin       = pin,
        fecha_expiracion = expiracion,
    )