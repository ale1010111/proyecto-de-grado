from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EstacionServicio

@admin.register(EstacionServicio)
class EstacionServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'departamento', 'municipio')
    search_fields = ('nombre', 'codigo')

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Campos que se muestran en la lista principal
    list_display = (
        "email", 
        "nombres", 
        "apellido_paterno", 
        "tipo_usuario", 
        "estacion_servicio", 
        "is_staff"
    )
    
    # Filtros laterales
    list_filter = ("tipo_usuario", "is_active", "is_staff", "estacion_servicio")
    
    # Campos de búsqueda
    search_fields = ("email", "nombres", "apellido_paterno", "estacion_servicio__nombre")
    
    # Ordenamiento por defecto
    ordering = ("email",)

    # FIELDSETS: Configuración del formulario de EDICIÓN de usuario
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Información Personal",
            {"fields": ("nombres", "apellido_paterno", "apellido_materno", "cargo")},
        ),
        (
            "Roles y Asignaciones",
            {"fields": ("tipo_usuario", "estacion_servicio")},
        ),
        (
            "Permisos",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Fechas Importantes", {"fields": ("last_login", "date_joined")}),
    )

    # ADD_FIELDSETS: Configuración del formulario de CREACIÓN (botón "Añadir usuario")
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password",
                    "nombres",
                    "apellido_paterno",
                    "tipo_usuario",
                    "estacion_servicio"
                ),
            },
        ),
    )