from ai_assistant.models import DocumentTemplate


DEFAULT_TEMPLATES = [
    {
        "document_type": "complaint",
        "name": "Complaint / Plainte",
        "description": "Plainte generale a adresser a une autorite competente.",
        "required_fields": ["identite", "faits", "date", "lieu", "preuves", "demande"],
        "structure": (
            "1. Destinataire\n"
            "2. Identite du demandeur\n"
            "3. Objet\n"
            "4. Expose chronologique des faits\n"
            "5. Fondement juridique si disponible\n"
            "6. Demandes\n"
            "7. Pieces jointes\n"
            "8. Formule de politesse et signature"
        ),
    },
    {
        "document_type": "appeal",
        "name": "Appeal / Appel",
        "description": "Projet d'appel ou contestation d'une decision.",
        "required_fields": ["decision_contestee", "date_notification", "motifs", "demandes"],
        "structure": (
            "1. Juridiction ou autorite\n"
            "2. References de la decision contestee\n"
            "3. Recevabilite et delai si connus\n"
            "4. Moyens de contestation\n"
            "5. Demandes finales\n"
            "6. Pieces jointes"
        ),
    },
    {
        "document_type": "petition",
        "name": "Petition / Arida",
        "description": "Requete ou arida structuree pour presenter une demande juridique.",
        "required_fields": ["identite", "defendeur", "faits", "fondement", "demandes"],
        "structure": (
            "1. Tribunal ou autorite competente\n"
            "2. Parties\n"
            "3. Objet de la requete\n"
            "4. Expose des faits\n"
            "5. Discussion juridique\n"
            "6. Demandes\n"
            "7. Pieces jointes"
        ),
    },
    {
        "document_type": "administrative_request",
        "name": "Administrative Request / Demande administrative",
        "description": "Demande a une administration, commune, wilaya ou service public.",
        "required_fields": ["administration", "identite", "objet", "motif", "pieces"],
        "structure": (
            "1. Administration destinataire\n"
            "2. Identite du demandeur\n"
            "3. Objet\n"
            "4. Motif de la demande\n"
            "5. Demande formulee clairement\n"
            "6. Pieces jointes"
        ),
    },
    {
        "document_type": "employment_complaint",
        "name": "Employment Complaint / Reclamation travail",
        "description": "Reclamation liee au travail: licenciement, salaire, conges, abus.",
        "required_fields": ["employeur", "poste", "dates", "probleme", "preuves", "demande"],
        "structure": (
            "1. Destinataire\n"
            "2. Relation de travail\n"
            "3. Faits reproches\n"
            "4. Droits ou textes applicables si trouves\n"
            "5. Demandes\n"
            "6. Pieces jointes"
        ),
    },
    {
        "document_type": "rental_complaint",
        "name": "Rental Complaint / Reclamation location",
        "description": "Reclamation locative: caution, loyer, expulsion, reparations.",
        "required_fields": ["bailleur", "locataire", "logement", "contrat", "probleme", "demande"],
        "structure": (
            "1. Parties\n"
            "2. Logement concerne\n"
            "3. Situation contractuelle\n"
            "4. Probleme rencontre\n"
            "5. Demandes\n"
            "6. Pieces jointes"
        ),
    },
    {
        "document_type": "power_of_attorney",
        "name": "Power of Attorney / Procuration",
        "description": "Procuration simple pour mandater une personne.",
        "required_fields": ["mandant", "mandataire", "pouvoirs", "duree", "signature"],
        "structure": (
            "1. Identite du mandant\n"
            "2. Identite du mandataire\n"
            "3. Pouvoirs accordes\n"
            "4. Duree et limites\n"
            "5. Signature et legalisation si necessaire"
        ),
    },
    {
        "document_type": "contract",
        "name": "Contract / Contrat",
        "description": "Contrat civil ou commercial simple avec clauses principales.",
        "required_fields": ["parties", "objet", "prix", "duree", "obligations", "resiliation"],
        "structure": (
            "1. Parties\n"
            "2. Objet\n"
            "3. Obligations de chaque partie\n"
            "4. Prix ou contrepartie\n"
            "5. Duree\n"
            "6. Responsabilite\n"
            "7. Resiliation\n"
            "8. Signature"
        ),
    },
]


def ensure_default_templates():
    for item in DEFAULT_TEMPLATES:
        DocumentTemplate.objects.update_or_create(
            document_type=item["document_type"],
            defaults={
                "name": item["name"],
                "description": item["description"],
                "structure": item["structure"],
                "required_fields": item["required_fields"],
                "is_active": True,
            },
        )


def get_template(template_id=None, document_type=""):
    ensure_default_templates()
    templates = DocumentTemplate.objects.filter(is_active=True)
    if template_id:
        return templates.filter(id=template_id).first()
    if document_type:
        return templates.filter(document_type=document_type).first()
    return None
