from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User, EstacionServicio
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    EstacionServicioSerializer
)

# 1. Vista para Estaciones de Servicio (CRUD completo)
class EstacionServicioViewSet(viewsets.ModelViewSet):
    queryset = EstacionServicio.objects.all()
    serializer_class = EstacionServicioSerializer
    permission_classes = [permissions.IsAuthenticated] # Solo usuarios logueados

# 2. Vista para Usuarios (Lógica especial)
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    # No definimos un serializer_class fijo aquí, usamos el método get_serializer_class
    
    def get_serializer_class(self):
        """
        Usamos un serializer diferente si estamos CREANDO un usuario
        vs si estamos LEYENDO usuarios.
        """
        if self.action == 'create':
            return UserRegistrationSerializer
        return UserSerializer

    def get_permissions(self):
        """
        Permisos dinámicos:
        - Cualquiera puede registrarse (AllowAny en 'create').
        - Solo admins pueden ver la lista completa o borrar.
        """
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    # Ejemplo de acción extra: "Mi Perfil"
    # Esto permite ir a /api/users/me/ y ver tus propios datos sin saber tu ID
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)