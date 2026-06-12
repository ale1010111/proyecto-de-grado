# apps/users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, PerfilFuncionario, TokenVerificacion
from .forms import UserCreationForm, UserChangeForm


# ------------------------------------------------
# PERFIL FUNCIONARIO (INLINE)
# Muestra el perfil institucional dentro
# del detalle del usuario en el admin.
# ------------------------------------------------

class PerfilFuncionarioInline(admin.StackedInline):
    model         = PerfilFuncionario
    can_delete    = False
    verbose_name  = "Perfil Institucional"
    extra         = 0
    fields = [
        "tipo_documento",
        "numero_documento",
        "complemento_documento",
        "numero_funcionario",
        "cargo",
        "unidad_departamento",
        "celular",
        "estacion_servicio",
    ]


# ------------------------------------------------
# USER ADMIN
# ------------------------------------------------

@admin.register(User)
class UserAdmin(BaseUserAdmin):

    model    = User
    add_form = UserCreationForm
    form     = UserChangeForm

    inlines = [PerfilFuncionarioInline]

    # ------------------------------------------------
    # LISTA DE USUARIOS
    # ------------------------------------------------

    list_display = [
        "email",
        "nombres",
        "apellido_paterno",
        "tipo_usuario",
        "estado_cuenta",
        "email_verificado",
        "is_staff",
    ]

    list_filter = [
        "tipo_usuario",
        "estado_cuenta",
        "email_verificado",
        "is_staff",
    ]

    search_fields = [
        "email",
        "nombres",
        "apellido_paterno",
    ]

    ordering = ["apellido_paterno", "nombres"]

    # ------------------------------------------------
    # DETALLE DE USUARIO (EDICIÓN)
    # ------------------------------------------------

    fieldsets = (
        (None, {
            "fields": ("email", "password")
        }),
        ("Información personal", {
            "fields": (
                "nombres",
                "apellido_paterno",
                "apellido_materno",
            )
        }),
        ("Rol y estado", {
            "fields": (
                "tipo_usuario",
                "estado_cuenta",
                "email_verificado",
            )
        }),
        ("Seguridad", {
            "classes": ("collapse",),
            "fields": (
                "requiere_cambio_password",
                "intentos_fallidos",
                "bloqueado_hasta",
            )
        }),
        ("Permisos del sistema", {
            "classes": ("collapse",),
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            )
        }),
    )

    # ------------------------------------------------
    # CREACIÓN DE USUARIO
    # ------------------------------------------------

    add_fieldsets = (
        ("Datos de acceso", {
            "classes": ("wide",),
            "fields": (
                "email",
                "password1",
                "password2",
            )
        }),
        ("Identidad", {
            "classes": ("wide",),
            "fields": (
                "nombres",
                "apellido_paterno",
                "apellido_materno",
                "tipo_usuario",
            )
        }),
        ("Perfil institucional", {
            "classes": ("wide",),
            "fields": (
                "tipo_documento",
                "numero_documento",
                "complemento_documento",
                "numero_funcionario",
                "cargo",
                "unidad_departamento",
                "celular",
                "estacion_servicio",
            )
        }),
    )


# ------------------------------------------------
# TOKEN VERIFICACION ADMIN
# Solo lectura — útil para diagnóstico.
# ------------------------------------------------

@admin.register(TokenVerificacion)
class TokenVerificacionAdmin(admin.ModelAdmin):

    list_display = [
        "user",
        "tipo",
        "usado",
        "fecha_creacion",
        "fecha_expiracion",
    ]

    list_filter  = ["tipo", "usado"]
    search_fields = ["user__email"]
    ordering      = ["-fecha_creacion"]
    readonly_fields = [
        "user",
        "token",
        "codigo_pin",
        "tipo",
        "usado",
        "fecha_creacion",
        "fecha_expiracion",
    ]

    # No permitir crear ni eliminar tokens desde el admin
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False