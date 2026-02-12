from rest_framework import serializers
from .models import User, EstacionServicio

class EstacionServicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstacionServicio
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    # Opcional: Para mostrar el nombre de la estación en lugar de solo el ID al leer
    nombre_estacion = serializers.CharField(source='estacion_servicio.nombre', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'nombres', 'apellido_paterno', 'apellido_materno',
            'tipo_usuario', 'cargo', 'estacion_servicio', 'nombre_estacion', 'is_active'
        ]
        read_only_fields = ['id', 'is_active']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer exclusivo para el registro, maneja la contraseña de forma segura.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'password', 'nombres', 'apellido_paterno', 
            'apellido_materno', 'tipo_usuario', 'estacion_servicio'
        ]

    def create(self, validated_data):
        # Usamos create_user del Manager para que hashee la contraseña
        user = User.objects.create_user(**validated_data)
        return user