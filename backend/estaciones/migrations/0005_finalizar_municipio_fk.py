from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("estaciones", "0004_data_migrar_municipios"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="estacionservicio",
            name="municipio",
        ),
        migrations.RemoveField(
            model_name="estacionservicio",
            name="departamento",
        ),
        migrations.RenameField(
            model_name="estacionservicio",
            old_name="municipio_fk",
            new_name="municipio",
        ),
        migrations.AlterField(
            model_name="estacionservicio",
            name="municipio",
            field=models.ForeignKey(
                to="catalogos.municipio",
                on_delete=django.db.models.deletion.PROTECT,
                null=False,
                related_name="estaciones",
                verbose_name="Municipio",
            ),
        ),
        migrations.AlterModelOptions(
            name="estacionservicio",
            options={
                "verbose_name": "Estación de Servicio",
                "verbose_name_plural": "Estaciones de Servicio",
                "ordering": [
                    "municipio__provincia__departamento__nombre",
                    "municipio__nombre",
                    "nombre",
                ],
            },
        ),
        migrations.AddIndex(
            model_name="estacionservicio",
            index=models.Index(fields=["municipio"], name="estaciones_municipio_idx"),
        ),
    ]