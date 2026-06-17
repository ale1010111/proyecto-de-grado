from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("estaciones", "0002_initial"),
        ("catalogos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="estacionservicio",
            name="municipio_fk",
            field=models.ForeignKey(
                to="catalogos.municipio",
                on_delete=django.db.models.deletion.PROTECT,
                null=True,
                related_name="estaciones",
                verbose_name="Municipio",
            ),
        ),
    ]