from rest_framework import serializers
from .models import Solicitud


class SolicitudReadSerializer(serializers.ModelSerializer):
    consumidor_username = serializers.CharField(
        source="consumidor.user.username",
        read_only=True
    )

    estacion_nombre = serializers.CharField(
        source="estacion_servicio.nombre",
        read_only=True
    )

    class Meta:
        model = Solicitud
        fields = "__all__"


class SolicitudWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Solicitud
        fields = ["descripcion"]

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        consumidor = user.consumidor_perfil

        return Solicitud.objects.create(
            consumidor=consumidor,
            estacion_servicio=consumidor.estacion_servicio,
            **validated_data
        )
