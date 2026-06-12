# apps/consumidores/admin.py

from django.contrib import admin
from .models import ConsumidorPerfil, DocumentoIdentidad


# ------------------------------------------------
# DOCUMENTO IDENTIDAD (INLINE)
# ------------------------------------------------

class DocumentoIdentidadInline(admin.StackedInline):
    model        = DocumentoIdentidad
    extra        = 0
    can_delete   = False
    verbose_name = "Documento de Identidad"
    readonly_fields = [
        "tipo_documento",
        "numero_documento",
        "complemento_documento",
        "anverso",
        "reverso",
        "foto_sosteniendo",
        "fecha_subida",
    ]

    def has_add_permission(self, request, obj=None):
        return False


# ------------------------------------------------
# CONSUMIDOR PERFIL ADMIN
# ------------------------------------------------

@admin.register(ConsumidorPerfil)
class ConsumidorPerfilAdmin(admin.ModelAdmin):

    inlines = [DocumentoIdentidadInline]

    # ------------------------------------------------
    # LISTA
    # ------------------------------------------------

    list_display = [
        "get_nombre_completo",
        "get_email",
        "get_numero_documento",
        "actividad",
        "get_municipio",
        "estado_identidad",
        "alerta_repetitividad",
        "fecha_creacion",
    ]

    list_filter = [
        "estado_identidad",
        "alerta_repetitividad",
        "actividad",
        "departamento",
    ]

    search_fields = [
        "user__nombres",
        "user__apellido_paterno",
        "user__email",
        "documentos__numero_documento",
        "municipio__nombre",
    ]

    ordering = ["-fecha_creacion"]

    # ------------------------------------------------
    # DETALLE
    # ------------------------------------------------

    fieldsets = (
        ("Usuario", {
            "fields": ("user",)
        }),
        ("Datos personales", {
            "fields": (
                "fecha_nacimiento",
                "celular",
                "celular_verificado",
            )
        }),
        ("Ubicación", {
            "fields": (
                "departamento",
                "provincia",
                "municipio",
                "direccion",
            )
        }),
        ("Actividad económica", {
            "fields": ("actividad",)
        }),
        ("Verificación de identidad", {
            "fields": ("estado_identidad",)
        }),
        ("Control de repetitividad", {
            "classes": ("collapse",),
            "fields": (
                "alerta_repetitividad",
                "fecha_alerta",
                "motivo_bloqueo",
            )
        }),
        ("Auditoría", {
            "classes": ("collapse",),
            "fields": ("fecha_creacion", "fecha_actualizacion")
        }),
    )

    readonly_fields = [
        "user",
        "fecha_nacimiento",
        "celular_verificado",
        "fecha_alerta",
        "fecha_creacion",
        "fecha_actualizacion",
    ]

    # ------------------------------------------------
    # CAMPOS CALCULADOS
    # ------------------------------------------------

    @admin.display(description="Nombre completo")
    def get_nombre_completo(self, obj):
        return obj.user.nombre_completo()

    @admin.display(description="Email")
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description="N° Documento")
    def get_numero_documento(self, obj):
        doc = obj.documentos.first()
        if doc:
            return f"{doc.get_tipo_documento_display()} — {doc.numero_documento}"
        return "Sin documento"

    @admin.display(description="Municipio")
    def get_municipio(self, obj):
        if obj.municipio:
            return f"{obj.municipio.nombre}, {obj.departamento.nombre}"
        return "—"