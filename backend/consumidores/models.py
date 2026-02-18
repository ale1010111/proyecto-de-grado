from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from estaciones.models import EstacionServicio



class ConsumidorPerfil(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='consumidor_perfil',
        verbose_name="Usuario"
    )

    estacion_servicio = models.ForeignKey(
        EstacionServicio,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="consumidores",
        verbose_name="Estación de Servicio"
    )

    ci = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        verbose_name="Cédula de Identidad"
    )

    telefono = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name="Teléfono"
    )

    direccion = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name="Dirección"
    )

    fecha_nacimiento = models.DateField(
        null=True,
        blank=True,
        verbose_name="Fecha de nacimiento"
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Perfil de Consumidor"
        verbose_name_plural = "Perfiles de Consumidores"
        indexes = [
            models.Index(fields=['ci']),
        ]

    # =========================
    # VALIDACIONES DE NEGOCIO
    # =========================
    def clean(self):
        # Solo usuarios tipo CONSUMIDOR pueden tener este perfil
        if self.user.tipo_usuario != self.user.TipoUsuario.CONSUMIDOR:
            raise ValidationError(
                "Solo los usuarios tipo CONSUMIDOR pueden tener perfil de consumidor."
            )

    def perfil_completo(self):
        """
        Método utilitario para verificar si el perfil está completo.
        """
        return all([
            self.ci,
            self.telefono,
            self.direccion,
            self.fecha_nacimiento
        ])

    def save(self, *args, **kwargs):
        self.full_clean()  # fuerza validaciones siempre
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Perfil de {self.user.username}"

#