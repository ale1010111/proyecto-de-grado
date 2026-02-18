from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.tipo_usuario == 'ADMIN'
        )


class IsANH(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.tipo_usuario == 'ANH'
        )


class IsEstacionServicio(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.tipo_usuario == 'ESS'
        )


class IsConsumidor(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.tipo_usuario == 'CONS'
        )


class IsAdminOrANH(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.tipo_usuario in ['ADMIN', 'ANH']
        )
