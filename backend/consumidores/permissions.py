from rest_framework.permissions import BasePermission
from users.models import User

# Permisos personalizados para consumidores
class IsConsumidor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.tipo_usuario == User.TipoUsuario.CONS
        )


#permiso para que solo admin o anh puedan acceder a ciertas vistas, como la lista de consumidores o la eliminación de cuentas
class IsAdminOrANH(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.tipo_usuario in [
                User.TipoUsuario.ADMIN,
                User.TipoUsuario.ANH
            ]
        )