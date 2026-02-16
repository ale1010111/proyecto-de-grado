from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import ConsumidorPerfil
from .serializers import ConsumidorPerfilSerializer


class ConsumidorPerfilView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Obtener el perfil del consumidor autenticado.
        """
        user = request.user

        if user.tipo_usuario != user.TipoUsuario.CONSUMIDOR:
            return Response(
                {"detail": "Solo consumidores pueden acceder a este recurso."},
                status=status.HTTP_403_FORBIDDEN
            )

        perfil = user.consumidor_perfil
        serializer = ConsumidorPerfilSerializer(perfil)
        return Response(serializer.data)

    def put(self, request):
        """
        Completar o actualizar perfil.
        """
        user = request.user

        if user.tipo_usuario != user.TipoUsuario.CONSUMIDOR:
            return Response(
                {"detail": "Solo consumidores pueden modificar este recurso."},
                status=status.HTTP_403_FORBIDDEN
            )

        perfil = user.consumidor_perfil
        serializer = ConsumidorPerfilSerializer(
            perfil,
            data=request.data,
            partial=False  # exige todos los campos
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"detail": "Perfil actualizado correctamente."},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
