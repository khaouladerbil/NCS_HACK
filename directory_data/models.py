from django.db import models


class Address(models.Model):
    street = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    zip_code = models.CharField(max_length=255, blank=True, null=True)
    country = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=6, blank=True, null=True)

    class Meta:
        managed = True
        db_table = "directory_data_address"


class LawyerProfile(models.Model):
    specialization = models.CharField(max_length=2000)
    approved = models.BooleanField(null=True)
    address = models.ForeignKey(
        Address, on_delete=models.DO_NOTHING, db_column="address_id",
        db_constraint=False
    )
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")
    rating = models.IntegerField(null=True)

    class Meta:
        managed = True
        db_table = "directory_data_lawyerprofile"
        verbose_name = "Lawyer Profile"

    def __str__(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name or f"Lawyer #{self.id}"
