from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import ConsumidorPerfil
from .serializers import ConsumidorPerfilSerializer
from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import ConsumidorPerfil
from .serializers import ConsumidorPerfilSerializer
from users.permissions import IsConsumidor
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from users.permissions import IsAdminOrANH, IsEstacionServicio
from .models import ConsumidorPerfil
from .serializers import ConsumidorPerfilSerializer

class ConsumidorPerfilView(APIView):
    permission_classes = [IsAuthenticated, IsConsumidor]

    def get(self, request):
        perfil = request.user.consumidor_perfil
        serializer = ConsumidorPerfilSerializer(perfil)
        return Response(serializer.data)

    def put(self, request):
        perfil = request.user.consumidor_perfil
        serializer = ConsumidorPerfilSerializer(
            perfil,
            data=request.data,
            partial=False
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Perfil actualizado correctamente."},
            status=status.HTTP_200_OK
        )

#clase para que el admin pueda listar y gestionar los consumidores
class ConsumidorAdminViewSet(viewsets.ModelViewSet):
    queryset = ConsumidorPerfil.objects.select_related("user")
    serializer_class = ConsumidorPerfilSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated(), IsAdminOrANH() | IsEstacionServicio()]
        return [IsAuthenticated(), IsAdminOrANH()]