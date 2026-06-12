# apps/estaciones/admin.py

from django.contrib import admin

from .models import EstacionServicio


# ------------------------------------------------
# ESTACIÓN DE SERVICIO
# ------------------------------------------------

@admin.register(EstacionServicio)
class EstacionServicioAdmin(admin.ModelAdmin):

    # ------------------------------------------------
    # LISTA
    # ------------------------------------------------

    list_display = [
        "nombre",
        "codigo",
        "departamento",
        "municipio",
        "estado",
        "creada_por",
        "fecha_creacion",
    ]

    list_filter  = ["estado", "departamento"]

    search_fields = ["nombre", "codigo", "municipio", "departamento"]

    ordering = ["departamento", "nombre"]

    # ------------------------------------------------
    # DETALLE
    # ------------------------------------------------

    fieldsets = (
        ("Identificación", {
            "fields": ("nombre", "codigo")
        }),
        ("Ubicación", {
            "fields": ("direccion", "municipio", "departamento")
        }),
        ("Estado", {
            "fields": ("estado",)
        }),
        ("Auditoría", {
            "classes": ("collapse",),
            "fields": ("creada_por", "fecha_creacion", "fecha_actualizacion")
        }),
    )

    readonly_fields = ["creada_por", "fecha_creacion", "fecha_actualizacion"]

    # ------------------------------------------------
    # GUARDAR
    # Asigna automáticamente creada_por al admin
    # que crea la estación desde el panel.
    # ------------------------------------------------

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.creada_por = request.user
        super().save_model(request, obj, form, change)