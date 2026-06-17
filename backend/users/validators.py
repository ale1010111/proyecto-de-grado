# apps/users/validators.py

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class PasswordSeguroValidator:
    """
    Valida que la contraseña cumpla los estándares mínimos del sistema ANH:

    - Mínimo 8 caracteres (ya cubierto por MinimumLengthValidator de Django)
    - Al menos una letra mayúscula
    - Al menos un número
    - Al menos un carácter especial (!@#$%^&*...)
    - Sin secuencias numéricas obvias (123456, 654321, etc.)

    No afecta contraseñas existentes — solo se valida al crear
    o cambiar contraseñas.
    """

    SECUENCIAS_OBVIAS = [
        "123456", "654321", "012345", "234567", "345678",
        "456789", "567890", "111111", "000000", "999999",
        "123123", "321321", "112233", "aaaaaa", "abcdef",
    ]

    def validate(self, password, user=None):
        errores = []

        if not re.search(r"[A-Z]", password):
            errores.append(
                "La contraseña debe contener al menos una letra mayúscula."
            )

        if not re.search(r"\d", password):
            errores.append(
                "La contraseña debe contener al menos un número."
            )

        if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]", password):
            errores.append(
                "La contraseña debe contener al menos un carácter especial "
                "(!@#$%^&*...)."
            )

        password_lower = password.lower()
        for seq in self.SECUENCIAS_OBVIAS:
            if seq in password_lower:
                errores.append(
                    f"La contraseña no puede contener secuencias obvias "
                    f"como '{seq}'."
                )
                break  # Solo reportar una vez

        if errores:
            raise ValidationError(errores)

    def get_help_text(self):
        return _(
            "La contraseña debe tener al menos 8 caracteres, "
            "una mayúscula, un número, un carácter especial, "
            "y no contener secuencias obvias como '123456'."
        )