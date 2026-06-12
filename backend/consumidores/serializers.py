# apps/consumidores/serializers.py

from rest_framework import serializers
from users.serializers import UserSerializer
from .models import ConsumidorPerfil, DocumentoIdentidad


# ------------------------------------------------
# DOCUMENTO DE IDENTIDAD (LECTURA)
# ------------------------------------------------

class DocumentoIdentidadSerializer(serializers.ModelSerializer):

    tipo_documento_display = serializers.CharField(
        source="get_tipo_documento_display", read_only=True
    )

    class Meta:
        model  = DocumentoIdentidad
        fields = [
            "id",
            "tipo_documento",
            "tipo_documento_display",
            "numero_documento",
            "complemento_documento",
            "anverso",
            "reverso",
            "foto_sosteniendo",
            "fecha_subida",
        ]
        read_only_fields = fields


# ------------------------------------------------
# DOCUMENTO DE IDENTIDAD (ESCRITURA)
# ------------------------------------------------

class DocumentoIdentidadWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model  = DocumentoIdentidad
        fields = [
            "tipo_documento",
            "numero_documento",
            "complemento_documento",
            "anverso",
            "reverso",
            "foto_sosteniendo",
        ]

    def validate_anverso(self, value):
        return self._validar_imagen(value, "anverso")

    def validate_reverso(self, value):
        return self._validar_imagen(value, "reverso")

    def validate_foto_sosteniendo(self, value):
        return self._validar_imagen(value, "foto sosteniendo el documento")

    def _validar_imagen(self, value, nombre):
        tipos_permitidos = ["image/jpeg", "image/png", "image/webp"]
        limite_mb = 5
        if value.content_type not in tipos_permitidos:
            raise serializers.ValidationError(
                f"El {nombre} debe ser JPG, PNG o WebP."
            )
        if value.size > limite_mb * 1024 * 1024:
            raise serializers.ValidationError(
                f"El {nombre} no puede superar los {limite_mb} MB."
            )
        return value

    def validate(self, attrs):
        perfil = self.context.get("perfil")
        if perfil:
            tipo   = attrs.get("tipo_documento")
            existe = DocumentoIdentidad.objects.filter(
                perfil=perfil, tipo_documento=tipo
            ).exists()
            if existe:
                raise serializers.ValidationError({
                    "tipo_documento": "Ya tiene un documento de este tipo registrado."
                })
        return attrs


# ------------------------------------------------
# PERFIL CONSUMIDOR (LECTURA DETALLADA)
# ------------------------------------------------

class ConsumidorPerfilSerializer(serializers.ModelSerializer):

    user                     = UserSerializer(read_only=True)
    documentos               = DocumentoIdentidadSerializer(many=True, read_only=True)
    estado_identidad_display = serializers.CharField(
        source="get_estado_identidad_display", read_only=True
    )
    alerta_display = serializers.CharField(
        source="get_alerta_repetitividad_display", read_only=True
    )
    actividad_display = serializers.CharField(
        source="get_actividad_display", read_only=True
    )
    es_mayor_de_edad = serializers.BooleanField(read_only=True)

    # Datos de ubicación legibles
    departamento_nombre = serializers.CharField(
        source="departamento.nombre", read_only=True
    )
    provincia_nombre = serializers.CharField(
        source="provincia.nombre", read_only=True
    )
    municipio_nombre = serializers.CharField(
        source="municipio.nombre", read_only=True
    )

    class Meta:
        model  = ConsumidorPerfil
        fields = [
            "id",
            "user",
            "fecha_nacimiento",
            "celular",
            "celular_verificado",
            "departamento",
            "departamento_nombre",
            "provincia",
            "provincia_nombre",
            "municipio",
            "municipio_nombre",
            "direccion",
            "actividad",
            "actividad_display",
            "estado_identidad",
            "estado_identidad_display",
            "alerta_repetitividad",
            "alerta_display",
            "fecha_alerta",
            "motivo_bloqueo",
            "es_mayor_de_edad",
            "documentos",
            "fecha_creacion",
            "fecha_actualizacion",
        ]
        read_only_fields = fields


# ------------------------------------------------
# PERFIL CONSUMIDOR (LISTADO OPTIMIZADO)
# ------------------------------------------------

class ConsumidorPerfilListSerializer(serializers.ModelSerializer):

    nombre_completo = serializers.SerializerMethodField()
    email           = serializers.EmailField(source="user.email", read_only=True)
    municipio_nombre = serializers.CharField(
        source="municipio.nombre", read_only=True
    )

    class Meta:
        model  = ConsumidorPerfil
        fields = [
            "id",
            "nombre_completo",
            "email",
            "estado_identidad",
            "alerta_repetitividad",
            "municipio_nombre",
            "fecha_creacion",
        ]

    def get_nombre_completo(self, obj):
        return obj.user.nombre_completo()


# ------------------------------------------------
# ACTUALIZAR PERFIL (CONSUMIDOR AUTENTICADO)
# ------------------------------------------------

class ConsumidorPerfilUpdateSerializer(serializers.ModelSerializer):
    """
    Campos editables por el consumidor después del registro.
    """

    class Meta:
        model  = ConsumidorPerfil
        fields = [
            "celular",
            "departamento",
            "provincia",
            "municipio",
            "direccion",
            "actividad",
        ]

    def validate(self, attrs):
        prov = attrs.get("provincia", getattr(self.instance, "provincia", None))
        dep  = attrs.get("departamento", getattr(self.instance, "departamento", None))
        mun  = attrs.get("municipio", getattr(self.instance, "municipio", None))

        if prov and dep and prov.departamento_id != dep.id:
            raise serializers.ValidationError({
                "provincia": "La provincia no pertenece al departamento seleccionado."
            })
        if mun and prov and mun.provincia_id != prov.id:
            raise serializers.ValidationError({
                "municipio": "El municipio no pertenece a la provincia seleccionada."
            })
        return attrs


# ------------------------------------------------
# CAMBIAR ESTADO DE IDENTIDAD (ANH)
# ------------------------------------------------

class CambiarEstadoIdentidadSerializer(serializers.Serializer):

    estado_identidad = serializers.ChoiceField(
        choices=ConsumidorPerfil.EstadoIdentidad.choices
    )
    observacion = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    def validate(self, attrs):
        if (
            attrs.get("estado_identidad") == ConsumidorPerfil.EstadoIdentidad.RECHAZADO
            and not attrs.get("observacion")
        ):
            raise serializers.ValidationError({
                "observacion": "Debe indicar el motivo del rechazo."
            })
        return attrs


# ------------------------------------------------
# CAMBIAR ALERTA DE REPETITIVIDAD (ANH)
# ------------------------------------------------

class CambiarAlertaSerializer(serializers.Serializer):
    """
    Permite a ANH cambiar el estado de alerta
    de un consumidor manualmente.
    """

    alerta_repetitividad = serializers.ChoiceField(
        choices=ConsumidorPerfil.EstadoAlerta.choices
    )
    motivo = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    def validate(self, attrs):
        if (
            attrs.get("alerta_repetitividad") == ConsumidorPerfil.EstadoAlerta.BLOQUEADO
            and not attrs.get("motivo")
        ):
            raise serializers.ValidationError({
                "motivo": "Debe indicar el motivo del bloqueo."
            })
        return attrs