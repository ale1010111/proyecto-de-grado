from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.exceptions import ValidationError
from .managers import UserManager


class EstacionServicio(models.Model):
    nombre = models.CharField(max_length=150)
    codigo = models.CharField(max_length=50, unique=True)
    departamento = models.CharField(max_length=50)
    municipio = models.CharField(max_length=50)

    class Meta:
        verbose_name = "Estación de Servicio"
        verbose_name_plural = "Estaciones de Servicio"

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class User(AbstractBaseUser, PermissionsMixin):

    class TipoUsuario(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador del Sistema'
        ANH = 'ANH', 'Personal ANH'
        ESTACION_SERVICIO = 'ESS', 'Personal Estación de Servicio'
        CONSUMIDOR = 'CONS', 'Consumidor Final'

    username_validator = UnicodeUsernameValidator()

    # Credenciales
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[username_validator],
        verbose_name="Nombre de usuario",
        error_messages={
            'unique': "Ya existe un usuario con este nombre.",
        },
    )
    email = models.EmailField(
        unique=True,
        verbose_name="Correo electrónico"
    )

    # Datos personales
    nombres = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100, blank=True, null=True)

    # Rol
    tipo_usuario = models.CharField(
        max_length=10,
        choices=TipoUsuario.choices,
        default=TipoUsuario.CONSUMIDOR
    )

    # Relación con estación (solo ESS)
    estacion_servicio = models.ForeignKey(
        EstacionServicio,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios'
    )

    cargo = models.CharField(max_length=100, blank=True, null=True)

    # Flags del sistema
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'nombres', 'apellido_paterno']

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        indexes = [
            models.Index(fields=['tipo_usuario']),
        ]

    # =========================
    # VALIDACIONES DE NEGOCIO
    # =========================
    def clean(self):
        # Personal ANH → no estación
        if self.tipo_usuario == self.TipoUsuario.ANH and self.estacion_servicio:
            raise ValidationError({
                'estacion_servicio': 'El personal ANH no debe tener estación de servicio.'
            })

        # Personal de estación → estación obligatoria
        if self.tipo_usuario == self.TipoUsuario.ESTACION_SERVICIO and not self.estacion_servicio:
            raise ValidationError({
                'estacion_servicio': 'El personal de estación debe tener una estación asignada.'
            })

        # Consumidor → no estación
        if self.tipo_usuario == self.TipoUsuario.CONSUMIDOR and self.estacion_servicio:
            raise ValidationError({
                'estacion_servicio': 'El consumidor no debe tener estación de servicio.'
            })

    def save(self, *args, **kwargs):
        self.full_clean()  # fuerza validaciones siempre
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
