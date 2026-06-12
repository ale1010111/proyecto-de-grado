def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    from estaciones.models import EstacionServicio
    self.fields["estacion_servicio"].queryset = (
        EstacionServicio.objects.filter(estado="ACTIVA")
    )