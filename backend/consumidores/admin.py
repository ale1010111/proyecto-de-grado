from django.contrib import admin
from .models import ConsumidorPerfil


@admin.register(ConsumidorPerfil)
class ConsumidorPerfilAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'ci',
        'telefono',
        'fecha_nacimiento',
        'fecha_creacion'
    )

    search_fields = (
        'ci',
        'user__username',
        'user__email'
    )

    list_filter = (
        'fecha_creacion',
    )

    readonly_fields = (
        'fecha_creacion',
        'fecha_actualizacion'
    )
