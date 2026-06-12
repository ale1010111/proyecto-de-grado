# apps/catalogos/models.py

from django.db import models


# ------------------------------------------------
# DEPARTAMENTO
# Bolivia tiene 9 departamentos
# ------------------------------------------------

class Departamento(models.Model):

    nombre = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Departamento"
    )

    codigo = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="Código"
    )

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name        = "Departamento"
        verbose_name_plural = "Departamentos"
        ordering            = ["nombre"]


# ------------------------------------------------
# PROVINCIA
# Cada departamento tiene múltiples provincias
# ------------------------------------------------

class Provincia(models.Model):

    departamento = models.ForeignKey(
        Departamento,
        on_delete=models.PROTECT,
        related_name="provincias",
        verbose_name="Departamento"
    )

    nombre = models.CharField(
        max_length=100,
        verbose_name="Provincia"
    )

    codigo = models.CharField(
        max_length=10,
        verbose_name="Código"
    )

    def __str__(self):
        return f"{self.nombre} — {self.departamento.nombre}"

    class Meta:
        verbose_name        = "Provincia"
        verbose_name_plural = "Provincias"
        ordering            = ["departamento__nombre", "nombre"]
        unique_together     = [["departamento", "nombre"]]


# ------------------------------------------------
# MUNICIPIO
# Cada provincia tiene múltiples municipios
# ------------------------------------------------

class Municipio(models.Model):

    provincia = models.ForeignKey(
        Provincia,
        on_delete=models.PROTECT,
        related_name="municipios",
        verbose_name="Provincia"
    )

    nombre = models.CharField(
        max_length=100,
        verbose_name="Municipio"
    )

    codigo = models.CharField(
        max_length=10,
        verbose_name="Código"
    )

    def __str__(self):
        return (
            f"{self.nombre} — "
            f"{self.provincia.nombre}, "
            f"{self.provincia.departamento.nombre}"
        )

    class Meta:
        verbose_name        = "Municipio"
        verbose_name_plural = "Municipios"
        ordering            = ["provincia__nombre", "nombre"]
        unique_together     = [["provincia", "nombre"]]