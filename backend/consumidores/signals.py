from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.db import transaction
from .models import ConsumidorPerfil


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def crear_perfil_consumidor(sender, instance, created, **kwargs):
    """
    Crea automáticamente el perfil cuando se crea un usuario
    y su tipo es CONSUMIDOR.
    """
    if not created:
        return

    if instance.tipo_usuario == instance.TipoUsuario.CONSUMIDOR:
        # Evita duplicados por seguridad
        ConsumidorPerfil.objects.get_or_create(user=instance)
