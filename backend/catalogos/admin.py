# apps/catalogos/admin.py

from django.contrib import admin
from .models import Departamento, Provincia, Municipio


# ------------------------------------------------
# PROVINCIA INLINE
# ------------------------------------------------

class ProvinciaInline(admin.TabularInline):
    model   = Provincia
    extra   = 0
    fields  = ["nombre", "codigo"]


# ------------------------------------------------
# MUNICIPIO INLINE
# ------------------------------------------------

class MunicipioInline(admin.TabularInline):
    model  = Municipio
    extra  = 0
    fields = ["nombre", "codigo"]


# ------------------------------------------------
# DEPARTAMENTO
# ------------------------------------------------

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):

    list_display  = ["nombre", "codigo"]
    search_fields = ["nombre", "codigo"]
    inlines       = [ProvinciaInline]


# ------------------------------------------------
# PROVINCIA
# ------------------------------------------------

@admin.register(Provincia)
class ProvinciaAdmin(admin.ModelAdmin):

    list_display  = ["nombre", "departamento", "codigo"]
    list_filter   = ["departamento"]
    search_fields = ["nombre", "codigo"]
    inlines       = [MunicipioInline]


# ------------------------------------------------
# MUNICIPIO
# ------------------------------------------------

@admin.register(Municipio)
class MunicipioAdmin(admin.ModelAdmin):

    list_display  = ["nombre", "provincia", "get_departamento", "codigo"]
    list_filter   = ["provincia__departamento"]
    search_fields = ["nombre", "codigo"]

    @admin.display(description="Departamento")
    def get_departamento(self, obj):
        return obj.provincia.departamento.nombre