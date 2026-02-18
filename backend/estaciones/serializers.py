from rest_framework import serializers
from .models import EstacionServicio
from users.models import User


class EstacionServicioReadSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(
        source="usuario.username",
        read_only=True
    )

    creada_por_username = serializers.CharField(
        source="creada_por.username",
        read_only=True
    )

    total_consumidores = serializers.IntegerField(
        source="consumidores.count",
        read_only=True
    )

    class Meta:
        model = EstacionServicio
        fields = [
            "id",
            "nombre",
            "codigo",
            "direccion",
            "municipio",
            "departamento",
            "activa",
            "usuario",
            "usuario_username",
            "creada_por",
            "creada_por_username",
            "total_consumidores",
            "fecha_creacion",
        ]
        read_only_fields = [
            "creada_por",
            "fecha_creacion",
        ]
class EstacionServicioWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = EstacionServicio
        fields = [
            "nombre",
            "codigo",
            "direccion",
            "municipio",
            "departamento",
            "usuario",
            "activa",
        ]

    def validate_usuario(self, value):
        if value.tipo_usuario != value.TipoUsuario.ESS:
            raise serializers.ValidationError(
                "El usuario asignado debe ser tipo ESS."
            )

        if hasattr(value, "estacion"):
            raise serializers.ValidationError(
                "Este usuario ESS ya tiene una estación asignada."
            )

        return value
