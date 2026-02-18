from django.db import models
from django.conf import settings


class EstacionServicio(models.Model):

    nombre = models.CharField(max_length=150)
    codigo = models.CharField(max_length=50, unique=True)
    direccion = models.CharField(max_length=255)
    municipio = models.CharField(max_length=100)
    departamento = models.CharField(max_length=100)

    # Usuario ESS que administra la estación
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        limit_choices_to={"tipo_usuario": "ESS"},
        related_name="estacion"
    )

    # Quién creó la estación (ADMIN o ANH)
    creada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estaciones_creadas"
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    activa = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nombre} - {self.codigo}"
