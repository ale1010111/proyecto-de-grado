from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import User, EstacionServicio
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
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
        permission_map = {
            'create': [permissions.AllowAny],
            'me': [permissions.IsAuthenticated],
        }

        permission_classes = permission_map.get(
            self.action,
            [permissions.IsAdminUser]
        )

        return [permission() for permission in permission_classes]

    # Ejemplo de acción extra: "Mi Perfil"
    # Esto permite ir a /api/users/me/ y ver tus propios datos sin saber tu ID
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
# 3. Vista para Login (JWT)
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            refresh = response.data["refresh"]
            access = response.data["access"]

            response.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=False,  # 🔥 Cambiar a True en producción
                samesite="Lax",
            )

            response.data = {
                "access": access
            }

        return response
# Vista para refrescar el token usando el refresh token de la cookie
class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response({"detail": "No refresh token"}, status=401)

        try:
            token = RefreshToken(refresh_token)
            return Response({"access": str(token.access_token)})
        except Exception:
            return Response({"detail": "Invalid token"}, status=401)

# Vista para logout (borrar la cookie)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response = Response({"detail": "Logged out"})
        response.delete_cookie("refresh_token")
        return response