# apps/solicitudes/admin.py

from django.contrib import admin
from django.utils.html import format_html

from .models import Solicitud, AuditoriaEstadoSolicitud




class AuditoriaInline(admin.TabularInline):
    model        = AuditoriaEstadoSolicitud
    extra        = 0
    can_delete   = False
    verbose_name = "Registro de auditoría"
    readonly_fields = [
        "estado_anterior",
        "estado_nuevo",
        "usuario",
        "fecha",
        "ip_address",
        "nota",
    ]

    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):

    inlines = [AuditoriaInline]

    # ------------------------------------------------
    # LISTA
    # ------------------------------------------------

    list_display = [
        "id_publico_corto",
        "get_consumidor",
        "tipo_combustible",
        "litros_solicitados",
        "litros_aprobados",
        "litros_despachados",
        "estado_coloreado",
        "estacion_servicio",
        "fecha_creacion",
    ]

    list_filter = [
        "estado",
        "tipo_combustible",
        "tipo_combustible_aprobado",
        "estacion_servicio",
        "fecha_creacion",
    ]

    search_fields = [
        "id_publico",
        "consumidor__user__nombres",
        "consumidor__user__apellido_paterno",
        "consumidor__user__email",
        "consumidor__documentos__numero_documento",
    ]

    ordering = ["-fecha_creacion"]

    date_hierarchy = "fecha_creacion"

    # ------------------------------------------------
    # DETALLE
    # ------------------------------------------------

    fieldsets = (
        ("Identificación", {
            "fields": ("id_publico",)
        }),
        ("Consumidor", {
            "fields": ("consumidor",)
        }),
        ("Solicitud del consumidor", {
            "fields": (
                "tipo_combustible",
                "litros_solicitados",
            )
        }),
        ("Revisión ANH", {
            "fields": (
                "estado",
                "tipo_combustible_aprobado",
                "litros_aprobados",
                "observacion_anh",
                "aprobado_por",
                "estacion_asignada_por",
            )
        }),
        ("Estación asignada", {
            "fields": (
                "estacion_servicio",
                "fecha_expiracion",
            )
        }),
        ("Despacho", {
            "fields": (
                "litros_despachados",
                "despachado_por",
                "fecha_despacho",
            )
        }),
        ("Auditoría", {
            "classes": ("collapse",),
            "fields": (
                "creado_por",
                "fecha_creacion",
                "fecha_actualizacion",
                "fecha_revision",
                "fecha_aprobacion",
                "fecha_asignacion_estacion",
            )
        }),
    )

    readonly_fields = [
        "id_publico",
        "consumidor",
        "creado_por",
        "aprobado_por",
        "estacion_asignada_por",
        "despachado_por",
        "fecha_creacion",
        "fecha_actualizacion",
        "fecha_revision",
        "fecha_aprobacion",
        "fecha_asignacion_estacion",
        "fecha_despacho",
    ]

    # ------------------------------------------------
    # Sin creación ni eliminación desde el admin
    # Las solicitudes se crean desde el frontend
    # y se gestionan via API.
    # ------------------------------------------------

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    # ------------------------------------------------
    # CAMPOS CALCULADOS PARA list_display
    # ------------------------------------------------

    @admin.display(description="ID")
    def id_publico_corto(self, obj):
        """Muestra solo los primeros 8 caracteres del UUID."""
        return str(obj.id_publico)[:8].upper()

    @admin.display(description="Consumidor")
    def get_consumidor(self, obj):
        return obj.consumidor.user.nombre_completo()

    @admin.display(description="Estado")
    def estado_coloreado(self, obj):
        """
        Muestra el estado con color según su valor.
        """
        colores = {
            "PENDIENTE":  "#f59e0b",  # Amarillo
            "OBSERVADA":  "#3b82f6",  # Azul
            "APROBADA":   "#10b981",  # Verde
            "RECHAZADA":  "#ef4444",  # Rojo
            "DESPACHADA": "#6366f1",  # Violeta
            "EXPIRADA":   "#6b7280",  # Gris
        }
        color = colores.get(obj.estado, "#6b7280")
        return format_html(
            '<span style="'
            'background-color: {};'
            'color: white;'
            'padding: 3px 10px;'
            'border-radius: 12px;'
            'font-size: 11px;'
            'font-weight: bold;'
            '">{}</span>',
            color,
            obj.get_estado_display()
        )