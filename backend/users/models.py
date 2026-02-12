from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager

class EstacionServicio(models.Model):
    nombre = models.CharField(max_length=150)
    codigo = models.CharField(max_length=50, unique=True)
    departamento = models.CharField(max_length=50)
    municipio = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"

    class Meta:
        verbose_name = "Estación de Servicio"
        verbose_name_plural = "Estaciones de Servicio"


class User(AbstractBaseUser, PermissionsMixin):

    class TipoUsuario(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador del Sistema'
        ANH = 'ANH', 'Personal ANH'
        ESTACION_SERVICIO = 'ESS', 'Personal Estación de Servicio'
        CONSUMIDOR = 'CONS', 'Consumidor Final' # <-- Nuevo Rol Añadido

    email = models.EmailField(unique=True, verbose_name="Correo electrónico")
    nombres = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)

    tipo_usuario = models.CharField(
        max_length=10,
        choices=TipoUsuario.choices,
        default=TipoUsuario.CONSUMIDOR # Por defecto es consumidor
    )

    cargo = models.CharField(max_length=100, blank=True, null=True)

    # Relación con Estación (Solo para personal de ESS)
    estacion_servicio = models.ForeignKey(
        EstacionServicio,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios'
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombres', 'apellido_paterno']

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.email} ({self.get_tipo_usuario_display()})"
    
    @property
    def full_name(self):
        return f"{self.nombres} {self.apellido_paterno} {self.apellido_materno or ''}".strip()