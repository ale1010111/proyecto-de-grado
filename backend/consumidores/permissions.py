from rest_framework.permissions import BasePermission


class IsOwnerConsumidor(BasePermission):
    """
    Solo el consumidor dueño puede acceder a su perfil.
    """

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsReadOnly(BasePermission):
    """
    Permite solo métodos seguros (GET, HEAD, OPTIONS)
    """

    def has_permission(self, request, view):
        return request.method in ['GET', 'HEAD', 'OPTIONS']
