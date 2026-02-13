from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EstacionServicio
from .forms import UserCreationForm, UserChangeForm


@admin.register(EstacionServicio)
class EstacionServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo', 'departamento')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User
    add_form = UserCreationForm
    form = UserChangeForm

    list_display = ('username', 'email', 'nombres', 'tipo_usuario', 'is_staff')
    list_filter = ('tipo_usuario', 'is_staff')
    search_fields = ('username', 'email', 'nombres')
    ordering = ('username',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Información personal', {
            'fields': (
                'nombres',
                'apellido_paterno',
                'apellido_materno',
                'email',
                'cargo',
            )
        }),
        ('Roles', {
            'fields': (
                'tipo_usuario',
                'estacion_servicio',
            )
        }),
        ('Permisos', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions',
            )
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'username',
                'email',
                'nombres',
                'apellido_paterno',
                'apellido_materno',
                'tipo_usuario',
                'estacion_servicio',
                'cargo',
                'password1',
                'password2',
            ),
        }),
    )
