# apps/estaciones/models.py

from django.db import models
from django.conf import settings


# ------------------------------------------------
# ESTACION DE SERVICIO
# Entidad física independiente de los usuarios
# que la operan. La relación con usuarios ESS
# se gestiona desde PerfilFuncionario (FK).
# ------------------------------------------------

class EstacionServicio(models.Model):

    class EstadoEstacion(models.TextChoices):
        ACTIVA     = "ACTIVA",     "Activa"
        INACTIVA   = "INACTIVA",   "Inactiva"
        SUSPENDIDA = "SUSPENDIDA", "Suspendida"

    # ------------------------------------------------
    # DATOS DE IDENTIFICACIÓN
    # ------------------------------------------------

    nombre = models.CharField(
        max_length=150,
        verbose_name="Nombre"
    )

    codigo = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Código"
    )

    # ------------------------------------------------
    # UBICACIÓN
    # ------------------------------------------------

    direccion    = models.CharField(
        max_length=255,
        verbose_name="Dirección"
    )

    municipio    = models.CharField(
        max_length=100,
        verbose_name="Municipio"
    )

    departamento = models.CharField(
        max_length=100,
        verbose_name="Departamento"
    )

    # ------------------------------------------------
    # ESTADO
    # TextChoices en lugar de BooleanField para
    # mayor expresividad y extensibilidad futura.
    # ------------------------------------------------

    estado = models.CharField(
        max_length=20,
        choices=EstadoEstacion.choices,
        default=EstadoEstacion.ACTIVA,
        db_index=True,
        verbose_name="Estado"
    )

    # ------------------------------------------------
    # AUDITORÍA
    # La relación con usuarios ESS operadores
    # se gestiona desde PerfilFuncionario.estacion_servicio
    # No se guarda aquí para no acoplar la entidad física
    # al ciclo de vida de un usuario.
    # ------------------------------------------------

    creada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estaciones_creadas",
        verbose_name="Creada por"
    )

    fecha_creacion      = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    # ------------------------------------------------
    # MÉTODOS
    # ------------------------------------------------

    @property
    def esta_activa(self) -> bool:
        return self.estado == self.EstadoEstacion.ACTIVA

    @property
    def operadores(self):
        """
        Retorna los usuarios ESS asignados a esta estación
        via PerfilFuncionario.
        """
        return self.funcionarios.filter(
            user__tipo_usuario="ESS",
            user__estado_cuenta="ACTIVO"
        ).select_related("user")

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    class Meta:
        verbose_name        = "Estación de Servicio"
        verbose_name_plural = "Estaciones de Servicio"
        ordering            = ["departamento", "municipio", "nombre"]

        indexes = [
            models.Index(fields=["estado"]),
            models.Index(fields=["departamento", "municipio"]),
        ]