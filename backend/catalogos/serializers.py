# apps/catalogos/serializers.py

from rest_framework import serializers
from .models import Departamento, Provincia, Municipio


class MunicipioSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Municipio
        fields = ["id", "nombre", "codigo"]


class ProvinciaSerializer(serializers.ModelSerializer):

    municipios = MunicipioSerializer(many=True, read_only=True)

    class Meta:
        model  = Provincia
        fields = ["id", "nombre", "codigo", "municipios"]


class DepartamentoSerializer(serializers.ModelSerializer):

    provincias = ProvinciaSerializer(many=True, read_only=True)

    class Meta:
        model  = Departamento
        fields = ["id", "nombre", "codigo", "provincias"]


class DepartamentoListSerializer(serializers.ModelSerializer):
    """Liviano para listado sin provincias ni municipios."""

    class Meta:
        model  = Departamento
        fields = ["id", "nombre", "codigo"]


class ProvinciaListSerializer(serializers.ModelSerializer):
    """Liviano para listado sin municipios."""

    class Meta:
        model  = Provincia
        fields = ["id", "nombre", "codigo"]