# apps/users/serializers.py

from django.db import transaction
from django.contrib.auth import authenticate
from django.utils import timezone

from rest_framework import serializers

from .models import User, PerfilFuncionario, TokenVerificacion


# ------------------------------------------------
# SERIALIZER BASE (LECTURA)
# ------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """
    Lectura general del usuario autenticado.
    No expone datos sensibles.
    """

    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "nombre_completo",
            "nombres",
            "apellido_paterno",
            "apellido_materno",
            "tipo_usuario",
            "estado_cuenta",
            "email_verificado",
            "date_joined",
        ]
        read_only_fields = fields

    def get_nombre_completo(self, obj):
        return obj.nombre_completo()


# ------------------------------------------------
# PERFIL FUNCIONARIO (LECTURA)
# ------------------------------------------------

class PerfilFuncionarioSerializer(serializers.ModelSerializer):
    """
    Lectura del perfil institucional de un funcionario.
    """

    class Meta:
        model = PerfilFuncionario
        fields = [
            "tipo_documento",
            "numero_documento",
            "complemento_documento",
            "numero_funcionario",
            "cargo",
            "unidad_departamento",
            "celular",
            "estacion_servicio",
            "fecha_creacion",
        ]
        read_only_fields = fields


# ------------------------------------------------
# CREAR FUNCIONARIO (ADMIN → UN SOLO PASO)
# Crea User + PerfilFuncionario en una transacción.
# ------------------------------------------------

class CrearFuncionarioSerializer(serializers.Serializer):
    """
    Usado por el administrador para crear funcionarios
    de tipo ADMIN, ANH o ESS en un solo paso.
    """

    # --- Datos de User ---
    email            = serializers.EmailField()
    nombres          = serializers.CharField(max_length=100)
    apellido_paterno = serializers.CharField(max_length=100)
    apellido_materno = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        default=""
    )
    tipo_usuario = serializers.ChoiceField(
        choices=[
            User.TipoUsuario.ADMIN,
            User.TipoUsuario.ANH,
            User.TipoUsuario.ESS,
        ]
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )

    # --- Datos de PerfilFuncionario ---
    tipo_documento = serializers.ChoiceField(
        choices=PerfilFuncionario.TipoDocumento.choices
    )
    numero_documento      = serializers.CharField(max_length=20)
    complemento_documento = serializers.CharField(
        max_length=10,
        required=False,
        allow_blank=True,
        default=""
    )
    numero_funcionario  = serializers.CharField(max_length=30)
    cargo               = serializers.CharField(max_length=100)
    unidad_departamento = serializers.CharField(max_length=100)
    celular             = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
        default=""
    )
    estacion_servicio = serializers.PrimaryKeyRelatedField(
        queryset=[],  # Se asigna en __init__
        required=False,
        allow_null=True
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from estaciones.models import EstacionServicio
        self.fields["estacion_servicio"].queryset = (
            EstacionServicio.objects.filter(estado="ACTIVA")
        )

    # ------------------------------------------------
    # VALIDACIONES
    # ------------------------------------------------

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Ya existe un usuario registrado con este correo."
            )
        return value

    def validate_numero_documento(self, value):
        if PerfilFuncionario.objects.filter(numero_documento=value).exists():
            raise serializers.ValidationError(
                "Ya existe un funcionario con este número de documento."
            )
        return value

    def validate_numero_funcionario(self, value):
        if PerfilFuncionario.objects.filter(numero_funcionario=value).exists():
            raise serializers.ValidationError(
                "Ya existe un funcionario con este número de funcionario."
            )
        return value

    def validate(self, attrs):
        tipo = attrs.get("tipo_usuario")
        estacion = attrs.get("estacion_servicio")

        # ESS debe tener estación asignada
        if tipo == User.TipoUsuario.ESS and not estacion:
            raise serializers.ValidationError({
                "estacion_servicio": (
                    "Un usuario ESS debe tener una estación de servicio asignada."
                )
            })

        # ADMIN y ANH no deben tener estación
        if tipo in [User.TipoUsuario.ADMIN, User.TipoUsuario.ANH] and estacion:
            raise serializers.ValidationError({
                "estacion_servicio": (
                    "Los usuarios ADMIN y ANH no deben tener estación asignada."
                )
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        # Separar datos de User y PerfilFuncionario
        user_fields = [
            "email", "nombres", "apellido_paterno",
            "apellido_materno", "tipo_usuario", "password",
        ]
        perfil_fields = [
            "tipo_documento", "numero_documento", "complemento_documento",
            "numero_funcionario", "cargo", "unidad_departamento",
            "celular", "estacion_servicio",
        ]

        user_data   = {k: validated_data[k] for k in user_fields}
        perfil_data = {k: validated_data[k] for k in perfil_fields if k in validated_data}

        # Crear usuario — password se hashea con set_password
        password = user_data.pop("password")
        user = User(**user_data)
        user.set_password(password)
        user.estado_cuenta = User.EstadoCuenta.ACTIVO  # Admin lo crea activo
        user.email_verificado = True                    # Admin lo verifica directamente
        user.full_clean()
        user.save()

        # Crear perfil institucional
        PerfilFuncionario.objects.create(user=user, **perfil_data)

        return user


# ------------------------------------------------
# REGISTRO DE CONSUMIDOR (FRONTEND → UN SOLO PASO)
# Crea User (CONS) + ConsumidorPerfil en una transacción.
# ------------------------------------------------

class RegistroConsumidorSerializer(serializers.Serializer):
    """
    Registro público de consumidores desde el frontend.
    Crea User (CONS) + ConsumidorPerfil + DocumentoIdentidad.
    El estado queda PENDIENTE hasta verificar email.
    """

    # --- Datos de User ---
    email            = serializers.EmailField()
    nombres          = serializers.CharField(max_length=100)
    apellido_paterno = serializers.CharField(max_length=100)
    apellido_materno = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )
    password  = serializers.CharField(
        write_only=True, min_length=8,
        style={"input_type": "password"}
    )
    password2 = serializers.CharField(
        write_only=True, style={"input_type": "password"}
    )

    # --- Datos de ConsumidorPerfil ---
    fecha_nacimiento = serializers.DateField()
    celular          = serializers.CharField(max_length=20)

    departamento = serializers.PrimaryKeyRelatedField(queryset=[])
    provincia    = serializers.PrimaryKeyRelatedField(queryset=[])
    municipio    = serializers.PrimaryKeyRelatedField(queryset=[])
    direccion    = serializers.CharField(max_length=100)
    actividad    = serializers.ChoiceField(
        choices=[]  # Se asigna en __init__
    )

    # --- Datos de DocumentoIdentidad ---
    tipo_documento        = serializers.ChoiceField(choices=[])
    numero_documento      = serializers.CharField(max_length=30)
    complemento_documento = serializers.CharField(
        max_length=10, required=False, allow_blank=True, default=""
    )
    anverso          = serializers.ImageField()
    reverso          = serializers.ImageField()
    foto_sosteniendo = serializers.ImageField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from catalogos.models import Departamento, Provincia, Municipio
        from consumidores.models import ConsumidorPerfil, DocumentoIdentidad

        self.fields["departamento"].queryset = Departamento.objects.all()
        self.fields["provincia"].queryset    = Provincia.objects.all()
        self.fields["municipio"].queryset    = Municipio.objects.all()
        self.fields["actividad"].choices     = ConsumidorPerfil.ActividadEconomica.choices
        self.fields["tipo_documento"].choices = DocumentoIdentidad.TipoDocumento.choices

    # ------------------------------------------------
    # VALIDACIONES
    # ------------------------------------------------

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Ya existe una cuenta registrada con este correo."
            )
        return value

    def validate_numero_documento(self, value):
        from consumidores.models import DocumentoIdentidad
        if DocumentoIdentidad.objects.filter(numero_documento=value).exists():
            raise serializers.ValidationError(
                "Este número de documento ya está registrado en el sistema."
            )
        return value

    def validate_fecha_nacimiento(self, value):
        from datetime import date
        hoy = date.today()
        edad = (
            hoy.year - value.year
            - ((hoy.month, hoy.day) < (value.month, value.day))
        )
        if edad < 18:
            raise serializers.ValidationError(
                "Debe ser mayor de 18 años para registrarse."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({
                "password2": "Las contraseñas no coinciden."
            })

        # Validar que provincia pertenece al departamento
        prov = attrs.get("provincia")
        dep  = attrs.get("departamento")
        if prov and dep and prov.departamento_id != dep.id:
            raise serializers.ValidationError({
                "provincia": "La provincia no pertenece al departamento seleccionado."
            })

        # Validar que municipio pertenece a la provincia
        mun  = attrs.get("municipio")
        if mun and prov and mun.provincia_id != prov.id:
            raise serializers.ValidationError({
                "municipio": "El municipio no pertenece a la provincia seleccionada."
            })

        return attrs

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

    def validate_anverso(self, value):
        return self._validar_imagen(value, "anverso")

    def validate_reverso(self, value):
        return self._validar_imagen(value, "reverso")

    def validate_foto_sosteniendo(self, value):
        return self._validar_imagen(value, "foto sosteniendo el documento")

    @transaction.atomic
    def create(self, validated_data):
        from consumidores.models import ConsumidorPerfil, DocumentoIdentidad

        validated_data.pop("password2")
        password = validated_data.pop("password")

        # Separar datos
        campos_user   = ["email", "nombres", "apellido_paterno", "apellido_materno"]
        campos_perfil = [
            "fecha_nacimiento", "celular", "departamento",
            "provincia", "municipio", "direccion", "actividad"
        ]
        campos_doc = [
            "tipo_documento", "numero_documento", "complemento_documento",
            "anverso", "reverso", "foto_sosteniendo"
        ]

        user_data   = {k: validated_data.pop(k) for k in campos_user if k in validated_data}
        perfil_data = {k: validated_data.pop(k) for k in campos_perfil if k in validated_data}
        doc_data    = {k: validated_data.pop(k) for k in campos_doc if k in validated_data}

        # Crear User
        user = User(tipo_usuario=User.TipoUsuario.CONS, **user_data)
        user.set_password(password)
        user.full_clean()
        user.save()

        # Crear ConsumidorPerfil
        perfil = ConsumidorPerfil.objects.create(user=user, **perfil_data)

        # Crear DocumentoIdentidad
        DocumentoIdentidad.objects.create(perfil=perfil, **doc_data)

        return user


# ------------------------------------------------
# LOGIN
# ------------------------------------------------

class LoginSerializer(serializers.Serializer):
    """
    Autenticación por email y contraseña.
    Valida estado de cuenta y bloqueo antes de autenticar.
    """

    email    = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )

    def validate_email(self, value):
        return value.lower().strip()

    def validate(self, attrs):
        email    = attrs.get("email")
        password = attrs.get("password")

        # Verificar que el usuario existe
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Credenciales incorrectas."
            )

        # Verificar bloqueo por intentos fallidos
        if user.esta_bloqueado():
            raise serializers.ValidationError(
                "Cuenta bloqueada temporalmente. Intente más tarde."
            )

        # Verificar estado de cuenta
        if user.estado_cuenta == User.EstadoCuenta.SUSPENDIDO:
            raise serializers.ValidationError(
                "Su cuenta ha sido suspendida. Contacte al administrador."
            )

        # Verificar email verificado
        if not user.email_verificado:
            raise serializers.ValidationError(
                "Debe verificar su correo electrónico antes de iniciar sesión."
            )

        # Autenticar credenciales
        usuario_autenticado = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password
        )

        if not usuario_autenticado:
            raise serializers.ValidationError(
                "Credenciales incorrectas."
            )

        attrs["user"] = usuario_autenticado
        return attrs


# ------------------------------------------------
# VERIFICACIÓN DE EMAIL POR PIN
# ------------------------------------------------

class VerificarEmailSerializer(serializers.Serializer):
    """
    Verifica el email del consumidor mediante
    un código PIN de 6 dígitos enviado por correo.
    """

    email      = serializers.EmailField()
    codigo_pin = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        email      = attrs.get("email", "").lower().strip()
        codigo_pin = attrs.get("codigo_pin")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No existe una cuenta con este correo."
            )

        token = (
            TokenVerificacion.objects
            .filter(
                user=user,
                tipo=TokenVerificacion.TipoToken.VERIFICACION_EMAIL,
                codigo_pin=codigo_pin,
                usado=False,
            )
            .order_by("-fecha_creacion")
            .first()
        )

        if not token:
            raise serializers.ValidationError(
                "Código PIN incorrecto."
            )

        if token.esta_expirado():
            raise serializers.ValidationError(
                "El código PIN ha expirado. Solicite uno nuevo."
            )

        attrs["user"]  = user
        attrs["token"] = token
        return attrs


# ------------------------------------------------
# SOLICITAR RECUPERACIÓN DE CONTRASEÑA
# ------------------------------------------------

class SolicitarRecuperacionSerializer(serializers.Serializer):
    """
    Recibe el email y genera un token de recuperación.
    Siempre responde con éxito para no revelar
    si el email existe en el sistema.
    """

    email = serializers.EmailField()

    def validate_email(self, value):
        # No revelamos si el email existe o no
        # La vista maneja la lógica de envío solo si existe
        return value


# ------------------------------------------------
# RECUPERAR CONTRASEÑA (CON TOKEN)
# ------------------------------------------------

class RecuperarPasswordSerializer(serializers.Serializer):
    """
    Permite cambiar la contraseña usando el token
    de recuperación enviado por correo.
    """

    token     = serializers.UUIDField()
    password  = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )
    password2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({
                "password2": "Las contraseñas no coinciden."
            })

        try:
            token = TokenVerificacion.objects.get(
                token=attrs["token"],
                tipo=TokenVerificacion.TipoToken.RECUPERACION_PASSWORD,
                usado=False,
            )
        except TokenVerificacion.DoesNotExist:
            raise serializers.ValidationError(
                "Token inválido o ya utilizado."
            )

        if token.esta_expirado():
            raise serializers.ValidationError(
                "El token ha expirado. Solicite uno nuevo."
            )

        attrs["token_obj"] = token
        return attrs


# ------------------------------------------------
# CAMBIO DE CONTRASEÑA (USUARIO AUTENTICADO)
# ------------------------------------------------

class CambiarPasswordSerializer(serializers.Serializer):
    """
    Permite al usuario autenticado cambiar su contraseña
    conociendo la actual. Usado también para forzar
    cambio cuando requiere_cambio_password=True.
    """

    password_actual = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )
    password_nuevo  = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"}
    )
    password_nuevo2 = serializers.CharField(
        write_only=True,
        style={"input_type": "password"}
    )

    def validate_password_actual(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                "La contraseña actual es incorrecta."
            )
        return value

    def validate(self, attrs):
        if attrs["password_nuevo"] != attrs["password_nuevo2"]:
            raise serializers.ValidationError({
                "password_nuevo2": "Las contraseñas nuevas no coinciden."
            })

        if attrs["password_actual"] == attrs["password_nuevo"]:
            raise serializers.ValidationError({
                "password_nuevo": (
                    "La contraseña nueva no puede ser igual a la actual."
                )
            })

        return attrs