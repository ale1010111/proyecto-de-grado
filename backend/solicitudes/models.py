from django.db import models
from django.conf import settings


class Solicitud(models.Model):

    class Estado(models.TextChoices):
        PENDIENTE = "PENDIENTE", "Pendiente"
        APROBADA = "APROBADA", "Aprobada"
        RECHAZADA = "RECHAZADA", "Rechazada"
        CANCELADA = "CANCELADA", "Cancelada"

    consumidor = models.ForeignKey(
        "consumidores.ConsumidorPerfil",
        on_delete=models.CASCADE,
        related_name="solicitudes"
    )

    estacion_servicio = models.ForeignKey(
        "estaciones.EstacionServicio",
        on_delete=models.CASCADE,
        related_name="solicitudes"
    )

    descripcion = models.TextField()

    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )

    observaciones = models.TextField(
        null=True,
        blank=True
    )

    aprobado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="solicitudes_aprobadas"
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Solicitud {self.id} - {self.estado}"
