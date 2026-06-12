# apps/catalogos/urls.py

from django.urls import path
from .views import (
    DepartamentoListView,
    DepartamentoDetailView,
    ProvinciasPorDepartamentoView,
    MunicipiosPorProvinciaView,
)

urlpatterns = [

    # Departamentos
    path(
        "departamentos/",
        DepartamentoListView.as_view(),
        name="departamentos-list"
    ),
    path(
        "departamentos/<int:pk>/",
        DepartamentoDetailView.as_view(),
        name="departamento-detail"
    ),

    # Provincias por departamento
    path(
        "departamentos/<int:departamento_id>/provincias/",
        ProvinciasPorDepartamentoView.as_view(),
        name="provincias-por-departamento"
    ),

    # Municipios por provincia
    path(
        "provincias/<int:provincia_id>/municipios/",
        MunicipiosPorProvinciaView.as_view(),
        name="municipios-por-provincia"
    ),
]