# apps/users/authentication.py

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Extiende JWTAuthentication para leer el token
    desde la cookie httponly en lugar del header
    Authorization: Bearer.

    Si la cookie está expirada o es inválida retorna
    None en lugar de lanzar excepción — esto permite
    que vistas con AllowAny funcionen sin bloquearse
    por cookies viejas.
    """

    def authenticate(self, request):

        cookie_name  = getattr(settings, "SIMPLE_JWT", {}).get(
            "AUTH_COOKIE", "access_token"
        )
        access_token = request.COOKIES.get(cookie_name)

        if access_token:
            # Solo inyectar si NO hay ya un header Authorization
            if "HTTP_AUTHORIZATION" not in request.META:
                request.META["HTTP_AUTHORIZATION"] = f"Bearer {access_token}"

        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            # Token expirado o inválido — limpiar el header inyectado
            # y retornar None para que la vista decida si requiere auth
            if access_token:
                request.META.pop("HTTP_AUTHORIZATION", None)
            return None