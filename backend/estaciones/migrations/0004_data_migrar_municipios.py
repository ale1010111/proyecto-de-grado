from django.db import migrations


def asignar_municipios(apps, schema_editor):
    EstacionServicio = apps.get_model("estaciones", "EstacionServicio")
    Municipio = apps.get_model("catalogos", "Municipio")

    mapeo = {
        ("trinidad", "beni"): ("Trinidad", "Beni"),
    }

    for estacion in EstacionServicio.objects.all():
        clave = (estacion.municipio.strip().lower(), estacion.departamento.strip().lower())
        nombre_mun, nombre_dep = mapeo.get(clave, (estacion.municipio, estacion.departamento))

        municipio = Municipio.objects.filter(
            nombre__iexact=nombre_mun,
            provincia__departamento__nombre__iexact=nombre_dep,
        ).first()

        if not municipio:
            raise ValueError(
                f"No se encontró Municipio para "
                f"'{estacion.municipio}, {estacion.departamento}' "
                f"(estación id={estacion.id}, {estacion.nombre}). "
                f"Agrega este municipio al catálogo antes de continuar."
            )

        estacion.municipio_fk = municipio
        estacion.save(update_fields=["municipio_fk"])


def revertir(apps, schema_editor):
    EstacionServicio = apps.get_model("estaciones", "EstacionServicio")
    EstacionServicio.objects.update(municipio_fk=None)


class Migration(migrations.Migration):

    dependencies = [
        ("estaciones", "0003_municipio_fk_temporal"),
    ]

    operations = [
        migrations.RunPython(asignar_municipios, revertir),
    ]