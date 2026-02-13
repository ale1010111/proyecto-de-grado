from django import forms
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from .models import User


class UserCreationForm(forms.ModelForm):
    """
    Formulario para crear usuarios desde el Django Admin
    """
    password1 = forms.CharField(
        label='Contraseña',
        widget=forms.PasswordInput
    )
    password2 = forms.CharField(
        label='Confirmar contraseña',
        widget=forms.PasswordInput
    )

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'nombres',
            'apellido_paterno',
            'apellido_materno',
            'tipo_usuario',
            'estacion_servicio',
            'cargo',
        )

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Las contraseñas no coinciden")

        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """
    Formulario para editar usuarios existentes
    """
    password = ReadOnlyPasswordHashField(label="Contraseña")

    class Meta:
        model = User
        fields = '__all__'
