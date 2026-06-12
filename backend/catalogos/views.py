# apps/catalogos/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Departamento, Provincia, Municipio
from .serializers import (
    DepartamentoListSerializer,
    DepartamentoSerializer,
    ProvinciaListSerializer,
    ProvinciaSerializer,
    MunicipioSerializer,
)


# ------------------------------------------------
# DEPARTAMENTOS
# ------------------------------------------------

class DepartamentoListView(APIView):
    """
    Lista todos los departamentos de Bolivia.
    Público — no requiere autenticación.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        departamentos = Departamento.objects.all()
        serializer    = DepartamentoListSerializer(departamentos, many=True)
        return Response(serializer.data)


class DepartamentoDetailView(APIView):
    """
    Retorna un departamento con todas sus provincias y municipios.
    """
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            departamento = Departamento.objects.prefetch_related(
                "provincias__municipios"
            ).get(pk=pk)
        except Departamento.DoesNotExist:
            return Response({"detail": "Departamento no encontrado."}, status=404)

        serializer = DepartamentoSerializer(departamento)
        return Response(serializer.data)


# ------------------------------------------------
# PROVINCIAS POR DEPARTAMENTO
# ------------------------------------------------

class ProvinciasPorDepartamentoView(APIView):
    """
    Lista las provincias de un departamento específico.
    Útil para cargar el segundo nivel del formulario.
    """
    permission_classes = [AllowAny]

    def get(self, request, departamento_id):
        provincias = Provincia.objects.filter(
            departamento_id=departamento_id
        ).order_by("nombre")

        serializer = ProvinciaListSerializer(provincias, many=True)
        return Response(serializer.data)


# ------------------------------------------------
# MUNICIPIOS POR PROVINCIA
# ------------------------------------------------

class MunicipiosPorProvinciaView(APIView):
    """
    Lista los municipios de una provincia específica.
    Útil para cargar el tercer nivel del formulario.
    """
    permission_classes = [AllowAny]

    def get(self, request, provincia_id):
        municipios = Municipio.objects.filter(
            provincia_id=provincia_id
        ).order_by("nombre")

        serializer = MunicipioSerializer(municipios, many=True)
        return Response(serializer.data)