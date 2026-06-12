# apps/solicitudes/management/commands/expirar_solicitudes.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction


class Command(BaseCommand):

    help = (
        "Expira solicitudes APROBADAS vencidas y rechaza "
        "solicitudes OBSERVADAS cuyo plazo de 24h venció."
    )

    def handle(self, *args, **options):

        ahora = timezone.now()

        self._expirar_aprobadas(ahora)
        self._rechazar_observadas_vencidas(ahora)

    # ------------------------------------------------
    # 1. EXPIRAR solicitudes APROBADAS no despachadas
    # ------------------------------------------------

    def _expirar_aprobadas(self, ahora):

        from solicitudes.models import Solicitud

        aprobadas_vencidas = Solicitud.objects.filter(
            estado=Solicitud.EstadoSolicitud.APROBADA,
            fecha_expiracion__lt=ahora,
        )

        total = aprobadas_vencidas.count()

        if total == 0:
            self.stdout.write("No hay solicitudes aprobadas vencidas.")
            return

        with transaction.atomic():
            for solicitud in aprobadas_vencidas.select_for_update():
                solicitud.estado = Solicitud.EstadoSolicitud.EXPIRADA
                solicitud.save(update_fields=["estado", "fecha_actualizacion"])

                from solicitudes.services.registrar_auditoria import registrar_auditoria
                registrar_auditoria(
                    solicitud       = solicitud,
                    estado_anterior = Solicitud.EstadoSolicitud.APROBADA,
                    estado_nuevo    = Solicitud.EstadoSolicitud.EXPIRADA,
                    usuario         = None,
                    nota            = "Expirada automáticamente por el sistema.",
                )

        self.stdout.write(
            self.style.SUCCESS(f"{total} solicitud(es) aprobada(s) expirada(s).")
        )

    # ------------------------------------------------
    # 2. RECHAZAR solicitudes OBSERVADAS sin respuesta
    # ------------------------------------------------

    def _rechazar_observadas_vencidas(self, ahora):

        from solicitudes.models import Solicitud

        observadas_vencidas = Solicitud.objects.filter(
            estado=Solicitud.EstadoSolicitud.OBSERVADA,
            fecha_limite_respuesta__lt=ahora,
        )

        total = observadas_vencidas.count()

        if total == 0:
            self.stdout.write("No hay solicitudes observadas vencidas.")
            return

        with transaction.atomic():
            for solicitud in observadas_vencidas.select_for_update():
                solicitud.estado = Solicitud.EstadoSolicitud.RECHAZADA
                solicitud.save(update_fields=["estado", "fecha_actualizacion"])

                from solicitudes.services.registrar_auditoria import registrar_auditoria
                registrar_auditoria(
                    solicitud       = solicitud,
                    estado_anterior = Solicitud.EstadoSolicitud.OBSERVADA,
                    estado_nuevo    = Solicitud.EstadoSolicitud.RECHAZADA,
                    usuario         = None,
                    nota            = (
                        "Rechazada automáticamente por no responder "
                        "la observación dentro del plazo de 24 horas."
                    ),
                )

                # Notificar al consumidor
                try:
                    from users.email_service import enviar_notificacion_solicitud_rechazada
                    enviar_notificacion_solicitud_rechazada(solicitud)
                except Exception:
                    pass

        self.stdout.write(
            self.style.WARNING(
                f"{total} solicitud(es) observada(s) rechazada(s) por vencimiento."
            )
        )