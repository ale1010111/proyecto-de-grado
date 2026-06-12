# apps/configuracion/models.py

from django.db import models
from django.core.exceptions import ValidationError


class ConfiguracionSistema(models.Model):
    """
    Configuración global del sistema ANH.
    Solo debe existir UNA instancia (Singleton).
    Se gestiona exclusivamente desde el admin de Django.
    """

    # ------------------------------------------------
    # SOLICITUDES
    # ------------------------------------------------

    tiempo_expiracion_solicitudes_horas = models.PositiveIntegerField(
        default=72,
        verbose_name="Expiración de solicitudes aprobadas (horas)",
        help_text="Horas para retirar el combustible tras la aprobación. Por defecto: 72h."
    )

    litros_maximo_por_solicitud = models.PositiveIntegerField(
        default=120,
        verbose_name="Límite máximo de litros por solicitud",
        help_text="Máximo de litros por solicitud. Por defecto: 120L."
    )

    dias_minimos_entre_solicitudes = models.PositiveIntegerField(
        default=7,
        verbose_name="Días mínimos entre solicitudes",
        help_text=(
            "Días que debe esperar un consumidor tras un despacho "
            "antes de crear una nueva solicitud. 0 = sin límite."
        )
    )

    horas_aviso_expiracion_solicitud = models.PositiveIntegerField(
        default=24,
        verbose_name="Horas de aviso antes de expiración",
        help_text=(
            "Horas antes del vencimiento en que se notifica "
            "al consumidor que su solicitud está por expirar."
        )
    )

    # ------------------------------------------------
    # CONTROL DE REPETITIVIDAD Y ACOPIO
    # ------------------------------------------------

    limite_litros_mensual = models.PositiveIntegerField(
        default=120,
        verbose_name="Límite de litros por mes por consumidor",
        help_text=(
            "Total de litros despachados que puede acumular "
            "un consumidor en un mes. Por defecto: 120L."
        )
    )

    limite_litros_semanal = models.PositiveIntegerField(
        default=30,
        verbose_name="Límite de litros por semana por consumidor",
        help_text=(
            "Total de litros despachados por semana. "
            "0 = sin límite semanal. Por defecto: 30L."
        )
    )

    periodo_control_solicitudes_dias = models.PositiveIntegerField(
        default=30,
        verbose_name="Período de control de repetitividad (días)",
        help_text="Ventana de días para contar solicitudes por consumidor."
    )

    limite_solicitudes_por_periodo = models.PositiveIntegerField(
        default=3,
        verbose_name="Límite de solicitudes por período",
        help_text=(
            "Número de solicitudes APROBADAS o DESPACHADAS en el período "
            "que activa la alerta de repetitividad."
        )
    )

    max_estaciones_distintas_por_mes = models.PositiveIntegerField(
        default=2,
        verbose_name="Máximo de estaciones distintas por mes",
        help_text=(
            "Si un consumidor retira en más estaciones distintas "
            "que este valor en un mes, se activa alerta de rotación."
        )
    )

    # ------------------------------------------------
    # SEGURIDAD — LOGIN
    # ------------------------------------------------

    max_intentos_fallidos = models.PositiveIntegerField(
        default=5,
        verbose_name="Máximo de intentos fallidos de login",
        help_text="Intentos antes de bloquear la cuenta. Por defecto: 5."
    )

    tiempo_bloqueo_minutos = models.PositiveIntegerField(
        default=15,
        verbose_name="Tiempo de bloqueo por intentos fallidos (minutos)",
        help_text="Minutos de bloqueo tras superar intentos fallidos. Por defecto: 15."
    )

    # ------------------------------------------------
    # SEGURIDAD — TOKENS Y PINS
    # ------------------------------------------------

    tiempo_expiracion_pin_minutos = models.PositiveIntegerField(
        default=15,
        verbose_name="Expiración de PIN de verificación (minutos)",
        help_text="Validez del PIN de 6 dígitos enviado por email. Por defecto: 15 min."
    )

    tiempo_expiracion_token_recuperacion_horas = models.PositiveIntegerField(
        default=1,
        verbose_name="Expiración de token de recuperación (horas)",
        help_text="Validez del token de recuperación de contraseña. Por defecto: 1 hora."
    )

    # ------------------------------------------------
    # AUDITORÍA
    # ------------------------------------------------

    fecha_actualizacion = models.DateTimeField(auto_now=True)

    actualizado_por = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="configuraciones_actualizadas",
        verbose_name="Última actualización por"
    )

    # ------------------------------------------------
    # VALIDACIONES
    # ------------------------------------------------

    def clean(self):

        if self.tiempo_expiracion_solicitudes_horas < 1:
            raise ValidationError(
                "El tiempo de expiración debe ser al menos 1 hora."
            )
        if self.litros_maximo_por_solicitud < 1:
            raise ValidationError("El límite de litros debe ser al menos 1.")
        if self.litros_maximo_por_solicitud > 500:
            raise ValidationError("El límite de litros no puede superar 500.")
        if self.max_intentos_fallidos < 1:
            raise ValidationError("El máximo de intentos debe ser al menos 1.")
        if self.tiempo_bloqueo_minutos < 1:
            raise ValidationError("El tiempo de bloqueo debe ser al menos 1 minuto.")
        if self.tiempo_expiracion_pin_minutos < 5:
            raise ValidationError("El PIN debe tener validez mínima de 5 minutos.")
        if self.limite_litros_mensual < self.litros_maximo_por_solicitud:
            raise ValidationError(
                "El límite mensual no puede ser menor al límite por solicitud."
            )
        if self.limite_solicitudes_por_periodo < 1:
            raise ValidationError(
                "El límite de solicitudes por período debe ser al menos 1."
            )

    # ------------------------------------------------
    # SINGLETON
    # ------------------------------------------------

    def save(self, *args, **kwargs):
        if not self.pk and ConfiguracionSistema.objects.exists():
            raise ValidationError(
                "Solo puede existir una configuración del sistema."
            )
        super().save(*args, **kwargs)

    @classmethod
    def obtener(cls) -> "ConfiguracionSistema":
        config, _ = cls.objects.get_or_create(pk=1)
        return config

    def __str__(self):
        return "Configuración del Sistema ANH"

    class Meta:
        verbose_name        = "Configuración del Sistema"
        verbose_name_plural = "Configuración del Sistema"