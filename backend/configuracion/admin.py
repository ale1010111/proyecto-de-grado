# apps/configuracion/admin.py

from django.contrib import admin
from django.contrib import messages

from .models import ConfiguracionSistema


@admin.register(ConfiguracionSistema)
class ConfiguracionSistemaAdmin(admin.ModelAdmin):
    """
    Admin para la configuración global del sistema.
    Solo permite editar — no crear ni eliminar
    ya que es un modelo Singleton.
    """

    # ------------------------------------------------
    # LISTA
    # ------------------------------------------------

    list_display = [
        "tiempo_expiracion_solicitudes_horas",
        "litros_maximo_por_solicitud",
        "max_intentos_fallidos",
        "tiempo_bloqueo_minutos",
        "tiempo_expiracion_pin_minutos",
        "fecha_actualizacion",
        "actualizado_por",
    ]

    # ------------------------------------------------
    # DETALLE
    # ------------------------------------------------

    fieldsets = (
        ("Solicitudes", {
            "fields": (
                "tiempo_expiracion_solicitudes_horas",
                "litros_maximo_por_solicitud",
                "dias_minimos_entre_solicitudes",
                "horas_aviso_expiracion_solicitud",
            ),
            "description": (
                "Parámetros que controlan el ciclo de vida "
                "de las solicitudes de combustible."
            )
        }),
        ("Control de repetitividad y acopio", {
            "fields": (
                "limite_litros_mensual",
                "limite_litros_semanal",
                "periodo_control_solicitudes_dias",
                "limite_solicitudes_por_periodo",
                "max_estaciones_distintas_por_mes",
            ),
            "description": (
                "Parámetros para detectar acopio y contrabando de combustible."
            )
        }),
        ("Seguridad — Login", {
            "fields": (
                "max_intentos_fallidos",
                "tiempo_bloqueo_minutos",
            ),
            "description": (
                "Controles de seguridad para el acceso al sistema."
            )
        }),
        ("Seguridad — Tokens y PINs", {
            "fields": (
                "tiempo_expiracion_pin_minutos",
                "tiempo_expiracion_token_recuperacion_horas",
            ),
            "description": (
                "Tiempo de validez de los códigos de verificación "
                "enviados por correo electrónico."
            )
        }),
        ("Auditoría", {
            "classes": ("collapse",),
            "fields": (
                "actualizado_por",
                "fecha_actualizacion",
            )
        }),
    )

    readonly_fields = ["fecha_actualizacion", "actualizado_por"]

    # ------------------------------------------------
    # SINGLETON — deshabilitar crear y eliminar
    # ------------------------------------------------

    def has_add_permission(self, request):
        # Solo permitir crear si no existe ninguna instancia
        return not ConfiguracionSistema.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    # ------------------------------------------------
    # GUARDAR — registrar quién actualizó
    # ------------------------------------------------

    def save_model(self, request, obj, form, change):
        obj.actualizado_por = request.user
        super().save_model(request, obj, form, change)

        messages.success(
            request,
            "Configuración del sistema actualizada correctamente."
        )