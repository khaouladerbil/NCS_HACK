from django.conf import settings
from django.db import models


class LegalSource(models.Model):
    SOURCE_TYPES = [
        ("law", "Law"),
        ("decree", "Decree"),
        ("code", "Code"),
        ("procedure", "Procedure"),
        ("template", "Template"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=255)
    source_type = models.CharField(max_length=30, choices=SOURCE_TYPES, default="law")
    jurisdiction = models.CharField(max_length=100, default="Algeria")
    category = models.CharField(max_length=100, blank=True)
    reference = models.CharField(max_length=255, blank=True)
    language = models.CharField(max_length=20, default="fr")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return self.title


class LegalChunk(models.Model):
    source = models.ForeignKey(
        LegalSource, on_delete=models.CASCADE, related_name="chunks"
    )
    chunk_index = models.PositiveIntegerField()
    text = models.TextField()
    article = models.CharField(max_length=100, blank=True)
    section = models.CharField(max_length=255, blank=True)
    embedding = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["source", "chunk_index"]
        unique_together = ("source", "chunk_index")

    def __str__(self):
        return f"{self.source} #{self.chunk_index}"


class AssistantDocument(models.Model):
    DOCUMENT_TYPES = [
        ("pdf", "PDF"),
        ("image", "Image"),
        ("word", "Word"),
        ("text", "Text"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assistant_documents",
    )
    legal_request = models.ForeignKey(
        "legal_path.LegalRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assistant_documents",
    )
    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, default="other")
    file = models.FileField(upload_to="assistant_documents/")
    extracted_text = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class AssistantDocumentChunk(models.Model):
    document = models.ForeignKey(
        AssistantDocument, on_delete=models.CASCADE, related_name="chunks"
    )
    chunk_index = models.PositiveIntegerField()
    text = models.TextField()
    embedding = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["document", "chunk_index"]
        unique_together = ("document", "chunk_index")

    def __str__(self):
        return f"{self.document} #{self.chunk_index}"


class ChatSession(models.Model):
    TASK_CHOICES = [
        ("qa", "Question Answering"),
        ("explain", "Explain"),
        ("analyze", "Analyze"),
        ("draft", "Draft"),
        ("lawyer", "Lawyer Recommendation"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assistant_chat_sessions",
    )
    legal_request = models.ForeignKey(
        "legal_path.LegalRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assistant_chat_sessions",
    )
    title = models.CharField(max_length=255, blank=True)
    task = models.CharField(max_length=30, choices=TASK_CHOICES, default="qa")
    language = models.CharField(max_length=20, default="fr")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title or f"Session {self.pk}"


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ("user", "User"),
        ("assistant", "Assistant"),
        ("system", "System"),
    ]

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    citations = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.role}: {self.content[:60]}"


class DraftDocument(models.Model):
    FORMAT_CHOICES = [
        ("text", "Text"),
        ("pdf", "PDF"),
        ("docx", "Word"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assistant_drafts",
    )
    legal_request = models.ForeignKey(
        "legal_path.LegalRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assistant_drafts",
    )
    document_type = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    content = models.TextField()
    output_format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default="text")
    file = models.FileField(upload_to="assistant_drafts/", null=True, blank=True)
    citations = models.JSONField(default=list, blank=True)
    missing_fields = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class DocumentTemplate(models.Model):
    DOCUMENT_TYPES = [
        ("complaint", "Complaint"),
        ("appeal", "Appeal"),
        ("petition", "Petition"),
        ("administrative_request", "Administrative Request"),
        ("employment_complaint", "Employment Complaint"),
        ("rental_complaint", "Rental Complaint"),
        ("power_of_attorney", "Power of Attorney"),
        ("contract", "Contract"),
    ]

    name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES, unique=True)
    description = models.TextField(blank=True)
    structure = models.TextField()
    required_fields = models.JSONField(default=list, blank=True)
    language = models.CharField(max_length=20, default="fr")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class LegalDocument(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("generated", "Generated"),
        ("edited", "Edited"),
        ("archived", "Archived"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="legal_documents",
    )
    template = models.ForeignKey(
        DocumentTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    legal_request = models.ForeignKey(
        "legal_path.LegalRequest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="legal_documents",
    )
    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50)
    situation = models.TextField(blank=True)
    content = models.TextField()
    language = models.CharField(max_length=20, default="fr")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="generated")
    citations = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title


class LawyerProfile(models.Model):
    SPECIALTIES = [
        ("labor", "Labor"),
        ("family", "Family"),
        ("civil", "Civil"),
        ("criminal", "Criminal"),
        ("property", "Property"),
        ("commercial", "Commercial"),
        ("administrative", "Administrative"),
        ("consumer", "Consumer"),
        ("other", "Other"),
    ]

    full_name = models.CharField(max_length=255)
    specialties = models.JSONField(default=list, blank=True)
    wilaya = models.CharField(max_length=100, blank=True)
    commune = models.CharField(max_length=100, blank=True)
    languages = models.JSONField(default=list, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    is_available = models.BooleanField(default=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self):
        return self.full_name
