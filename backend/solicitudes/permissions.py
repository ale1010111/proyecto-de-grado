# apps/solicitudes/permissions.py

from users.permissions import IsAdminOrANH, IsESS, IsConsumidor


# ------------------------------------------------
# CONSUMIDOR
# ------------------------------------------------

class EsConsumidor(IsConsumidor):
    """
    Permiso a nivel de vista.
    Hereda toda la lógica de IsConsumidor:
    - autenticado y activo
    - tipo_usuario == CONS
    - tiene ConsumidorPerfil asociado
    Usado en: create
    """
    pass


class EsConsumidorPropietario(IsConsumidor):
    """
    Permiso a nivel de vista y objeto.
    Verifica que la solicitud pertenezca
    al consumidor del usuario autenticado.
    Usado en: retrieve
    """

    def has_object_permission(self, request, view, obj):

        if not obj.consumidor:
            return False

        return obj.consumidor == request.user.consumidor


# ------------------------------------------------
# ANH
# ------------------------------------------------

class EsUsuarioANH(IsAdminOrANH):
    """
    Permiso a nivel de vista y objeto.
    Hereda verificación de rol desde IsAdminOrANH.
    Permite a ANH y ADMIN operar sobre cualquier
    solicitud: aprobar, observar, rechazar.
    """

    def has_object_permission(self, request, view, obj):
        # Sin restricción adicional a nivel objeto:
        # ANH y ADMIN pueden operar sobre cualquier solicitud.
        return request.user.tipo_usuario in self.allowed_roles


# ------------------------------------------------
# ESTACIÓN DE SERVICIO
# ------------------------------------------------

class EsEstacionAsignada(IsESS):
    """
    Permiso a nivel de vista y objeto.
    Hereda verificación de rol desde IsESS.
    A nivel de objeto verifica que la estación
    del funcionario sea la asignada a la solicitud.
    Usado en: despachar
    """

    def has_permission(self, request, view):

        # Verificar rol ESS primero
        if not super().has_permission(request, view):
            return False

        # Verificar que el funcionario tenga estación asignada
        return (
            hasattr(request.user, "perfil_funcionario")
            and request.user.perfil_funcionario.estacion_servicio is not None
        )

    def has_object_permission(self, request, view, obj):

        if not obj.estacion_servicio:
            return False

        return (
            obj.estacion_servicio
            == request.user.perfil_funcionario.estacion_servicio
        )