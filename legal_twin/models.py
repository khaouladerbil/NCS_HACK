from django.db import models
class CitizenProfile(models.Model):

    SEX_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
    ]

    WILAYA_CHOICES = [
        ("Adrar", "Adrar"),
        ("Chlef", "Chlef"),
        ("Laghouat", "Laghouat"),
        ("Oum El Bouaghi", "Oum El Bouaghi"),
        ("Batna", "Batna"),
        ("Bejaia", "Bejaia"),
        ("Biskra", "Biskra"),
        ("Bechar", "Bechar"),
        ("Blida", "Blida"),
        ("Bouira", "Bouira"),
        ("Tamanrasset", "Tamanrasset"),
        ("Tebessa", "Tebessa"),
        ("Tlemcen", "Tlemcen"),
        ("Tiaret", "Tiaret"),
        ("Tizi Ouzou", "Tizi Ouzou"),
        ("Algiers", "Algiers"),
        ("Djelfa", "Djelfa"),
        ("Jijel", "Jijel"),
        ("Setif", "Setif"),
        ("Saida", "Saida"),
        ("Skikda", "Skikda"),
        ("Sidi Bel Abbes", "Sidi Bel Abbes"),
        ("Annaba", "Annaba"),
        ("Guelma", "Guelma"),
        ("Constantine", "Constantine"),
        ("Medea", "Medea"),
        ("Mostaganem", "Mostaganem"),
        ("Msila", "Msila"),
        ("Mascara", "Mascara"),
        ("Ouargla", "Ouargla"),
        ("Oran", "Oran"),
        ("El Bayadh", "El Bayadh"),
        ("Illizi", "Illizi"),
        ("Bordj Bou Arreridj", "Bordj Bou Arreridj"),
        ("Boumerdes", "Boumerdes"),
        ("El Tarf", "El Tarf"),
        ("Tindouf", "Tindouf"),
        ("Tissemsilt", "Tissemsilt"),
        ("El Oued", "El Oued"),
        ("Khenchela", "Khenchela"),
        ("Souk Ahras", "Souk Ahras"),
        ("Tipaza", "Tipaza"),
        ("Mila", "Mila"),
        ("Ain Defla", "Ain Defla"),
        ("Naama", "Naama"),
        ("Ain Temouchent", "Ain Temouchent"),
        ("Ghardaia", "Ghardaia"),
        ("Relizane", "Relizane"),
        ("Timimoun", "Timimoun"),
        ("Bordj Badji Mokhtar", "Bordj Badji Mokhtar"),
        ("Ouled Djellal", "Ouled Djellal"),
        ("Beni Abbes", "Beni Abbes"),
        ("In Salah", "In Salah"),
        ("In Guezzam", "In Guezzam"),
        ("Touggourt", "Touggourt"),
        ("Djanet", "Djanet"),
        ("El M'Ghair", "El M'Ghair"),
        ("El Meniaa", "El Meniaa"),
    ]

    user = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="citizen_profile"
    )

    full_name = models.CharField(max_length=255)
    birth_date = models.DateField()
    sex = models.CharField(max_length=10, choices=SEX_CHOICES)
    wilaya = models.CharField(max_length=100, choices=WILAYA_CHOICES)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

def document_upload_path(instance, filename):
    return (
        f"documents/"
        f"user_{instance.profile.user.id}/"
        f"{instance.folder_name}/"
        f"{filename}"
    )
    
    
class CitizenDocument(models.Model):

    DOCUMENT_TYPES = [
        ("id_card", "ID Card"),
        ("passport", "Passport"),
        ("license", "License"),
        ("certificate", "Certificate"),
        ("employment_contract", "Employment Contract"),
        ("court_document", "Court Document"),
        ("other", "Other"),
    ]

    profile = models.ForeignKey(
        CitizenProfile,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    folder_name = models.CharField(
        max_length=100,
        default="General"
    )

    document_type = models.CharField(
        max_length=50,
        choices=DOCUMENT_TYPES
    )

    description = models.CharField(max_length=255)

    file = models.FileField(
        upload_to=document_upload_path
    )

    expiry_date = models.DateField(
        null=True,
        blank=True
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )
    def __str__(self):
        return self.folder_name

class CitizenCase(models.Model):

    STATUS_CHOICES = [
        ("open", "Open"),
        ("pending", "Pending"),
        ("closed", "Closed"),
    ]

    profile = models.ForeignKey(
        CitizenProfile,
        on_delete=models.CASCADE,
        related_name="cases"
    )

    case_number = models.CharField(max_length=100)

    title = models.CharField(max_length=255)

    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES
    )

    created_at = models.DateTimeField(auto_now_add=True)

class LegalDeadline(models.Model):

    profile = models.ForeignKey(
        CitizenProfile,
        on_delete=models.CASCADE,
        related_name="deadlines"
    )

    title = models.CharField(max_length=255)

    due_date = models.DateField()

    is_completed = models.BooleanField(default=False)