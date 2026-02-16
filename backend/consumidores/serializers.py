from rest_framework import serializers
from datetime import date
from .models import ConsumidorPerfil


class ConsumidorPerfilSerializer(serializers.ModelSerializer):

    class Meta:
        model = ConsumidorPerfil
        fields = [
            'ci',
            'telefono',
            'direccion',
            'fecha_nacimiento'
        ]

    def validate_ci(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError(
                "La cédula debe contener solo números."
            )
        return value

    def validate_fecha_nacimiento(self, value):
        if value.year < 1900:
            raise serializers.ValidationError(
                "Fecha de nacimiento inválida."
            )

        if value > date.today():
            raise serializers.ValidationError(
                "La fecha no puede ser futura."
            )

        return value
