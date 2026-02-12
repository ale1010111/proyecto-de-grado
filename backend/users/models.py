from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(
        unique=True,
        verbose_name="Correo electrónico"
    )

    nombres = models.CharField(
        max_length=100,
        verbose_name="Nombres"
    )

    apellido_paterno = models.CharField(
        max_length=100,
        verbose_name="Apellido paterno"
    )

    apellido_materno = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name="Apellido materno"
    )

    cargo = models.CharField(
        max_length=100,
        verbose_name="Cargo / Rol funcional"
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de registro"
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nombres", "apellido_paterno"]

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.nombres} {self.apellido_paterno} ({self.email})"
