# apps/users/managers.py

from django.contrib.auth.models import BaseUserManager


class UserManager(BaseUserManager):

    def create_user(
        self,
        email: str,
        nombres: str,
        apellido_paterno: str,
        tipo_usuario: str,
        password=None,
        **extra_fields
    ):
        # ----------------------------------------
        # Validaciones de campos requeridos
        # ----------------------------------------

        if not email:
            raise ValueError("El usuario debe tener un correo electrónico.")

        if not nombres:
            raise ValueError("El usuario debe tener un nombre.")

        if not apellido_paterno:
            raise ValueError("El usuario debe tener un apellido paterno.")

        if not tipo_usuario:
            raise ValueError("El usuario debe tener un tipo de usuario.")

        # ----------------------------------------
        # Crear usuario
        # ----------------------------------------

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            nombres=nombres,
            apellido_paterno=apellido_paterno,
            tipo_usuario=tipo_usuario,
            **extra_fields
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        email: str,
        nombres: str,
        apellido_paterno: str,
        password=None,
        **extra_fields
    ):
        if not password:
            raise ValueError("El superusuario debe tener una contraseña.")

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("email_verificado", True)

        from .models import User

        extra_fields.setdefault(
            "estado_cuenta",
            User.EstadoCuenta.ACTIVO
        )

        if extra_fields.get("is_staff") is not True:
            raise ValueError("El superusuario debe tener is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("El superusuario debe tener is_superuser=True.")

        # Eliminar tipo_usuario de extra_fields para evitar
        # duplicado con el argumento explícito en create_user
        extra_fields.pop("tipo_usuario", None)

        return self.create_user(
            email=email,
            nombres=nombres,
            apellido_paterno=apellido_paterno,
            tipo_usuario=User.TipoUsuario.ADMIN,
            password=password,
            **extra_fields
        )