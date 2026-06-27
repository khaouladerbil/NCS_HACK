SPECIALTY_LABELS = {
    "travail": "Droit du travail",
    "famille": "Droit de la famille",
    "immobilier": "Droit immobilier",
    "commercial": "Droit commercial",
    "administratif": "Droit administratif",
    "penal": "Droit pénal",
    "consommation": "Droit de la consommation",
    "other": "Conseil juridique général",
}

LEGAL_ROADMAPS = {
    "travail": [
        {"step": 1, "title": "Rassemblez vos preuves", "description": "Contrat de travail, bulletins de paie, emails, témoignages, tout document lié à votre situation."},
        {"step": 2, "title": "Tentez une résolution amiable", "description": "Contactez votre employeur par écrit (lettre recommandée) pour exposer votre situation et demander régularisation."},
        {"step": 3, "title": "Saisissez l'inspecteur du travail", "description": "Déposez une plainte à l'inspection du travail de votre wilaya. C'est gratuit et sans avocat obligatoire."},
        {"step": 4, "title": "Consultez un avocat spécialisé", "description": "Si l'inspection ne suffit pas, un avocat en droit du travail peut vous représenter devant le tribunal."},
        {"step": 5, "title": "Tribunal administratif ou judiciaire", "description": "Saisine du tribunal compétent. Délai moyen : 3 à 12 mois. Résultat : réintégration ou indemnisation."},
    ],
    "famille": [
        {"step": 1, "title": "Consultez un avocat de famille", "description": "Le droit de la famille en Algérie (divorce, garde, pension) nécessite un avocat dès le début."},
        {"step": 2, "title": "Rassemblez les documents", "description": "Acte de mariage, actes de naissance des enfants, jugements antérieurs, preuves financières."},
        {"step": 3, "title": "Tentative de conciliation", "description": "Le tribunal impose une séance de conciliation obligatoire avant tout jugement de divorce."},
        {"step": 4, "title": "Dépôt de la requête au tribunal", "description": "Votre avocat dépose la requête au tribunal de la famille (section civile du TPI)."},
        {"step": 5, "title": "Audience et jugement", "description": "Le juge statue sur le divorce, la garde, la pension alimentaire et la hadana. Délai : 2 à 6 mois."},
    ],
    "immobilier": [
        {"step": 1, "title": "Vérifiez les titres de propriété", "description": "Extrait de titre foncier, acte notarié, certificat de possession — à obtenir à la conservation foncière."},
        {"step": 2, "title": "Tentez un accord amiable", "description": "Médiateur ou notaire pour résoudre les conflits de voisinage, limites de terrain ou successions."},
        {"step": 3, "title": "Expertise foncière si nécessaire", "description": "Un géomètre agréé peut délimiter officiellement votre terrain en cas de litige de bornage."},
        {"step": 4, "title": "Saisine du tribunal civil", "description": "En cas d'échec amiable, dépôt d'une requête au TPI (tribunal de première instance)."},
        {"step": 5, "title": "Jugement et exécution", "description": "Le tribunal statue sur la propriété, l'expulsion ou le bail. Délai : 6 à 18 mois."},
    ],
    "commercial": [
        {"step": 1, "title": "Rassemblez les contrats et factures", "description": "Tous documents prouvant la relation commerciale : contrats, bons de commande, factures, correspondances."},
        {"step": 2, "title": "Mise en demeure", "description": "Envoyez une lettre recommandée avec accusé de réception pour réclamer paiement ou exécution du contrat."},
        {"step": 3, "title": "Médiation commerciale", "description": "Centre de médiation ou chambre de commerce — solution rapide avant le tribunal."},
        {"step": 4, "title": "Tribunal commercial", "description": "Saisine du tribunal commercial compétent. Requête avec pièces justificatives."},
        {"step": 5, "title": "Exécution du jugement", "description": "Après jugement favorable, huissier de justice pour recouvrement forcé de la créance."},
    ],
    "administratif": [
        {"step": 1, "title": "Identifiez l'acte administratif contesté", "description": "Décision de refus, licenciement fonctionnaire, arrêté municipal, permis refusé — précisez l'acte."},
        {"step": 2, "title": "Recours administratif préalable", "description": "Envoyez un recours gracieux à l'autorité qui a pris la décision dans les 2 mois."},
        {"step": 3, "title": "Recours hiérarchique", "description": "Si refus, saisissez l'autorité supérieure (wali, ministre selon le cas)."},
        {"step": 4, "title": "Tribunal administratif", "description": "Saisine du tribunal administratif compétent. Délai de recours : 4 mois après refus ou silence."},
        {"step": 5, "title": "Conseil d'État si nécessaire", "description": "En appel, le Conseil d'État algérien est la juridiction suprême en matière administrative."},
    ],
    "penal": [
        {"step": 1, "title": "Sécurisez votre sécurité immédiate", "description": "Si en danger : appelez la police (17) ou la gendarmerie (1055) immédiatement."},
        {"step": 2, "title": "Déposez plainte", "description": "Au commissariat ou à la gendarmerie. Obtenez le récépissé de dépôt de plainte."},
        {"step": 3, "title": "Consultez un avocat pénaliste", "description": "Obligatoire dès que vous êtes mis en cause ou si l'affaire est grave. Le barreau peut vous orienter."},
        {"step": 4, "title": "Instruction judiciaire", "description": "Le procureur décide de classer, d'ouvrir une information judiciaire ou de citer directement."},
        {"step": 5, "title": "Audience correctionnelle ou criminelle", "description": "Selon la gravité : tribunal correctionnel (délit) ou cour criminelle (crime). Votre avocat plaide."},
    ],
    "consommation": [
        {"step": 1, "title": "Conservez toutes les preuves", "description": "Facture, bon de garantie, photos du produit défectueux, échanges avec le vendeur."},
        {"step": 2, "title": "Réclamation au vendeur", "description": "Demande écrite de remboursement ou remplacement. Délai légal de garantie : 6 mois minimum."},
        {"step": 3, "title": "Saisir la direction du commerce", "description": "Direction de la concurrence et des prix de votre wilaya — dépôt de plainte gratuit."},
        {"step": 4, "title": "Association de consommateurs", "description": "Associations agréées peuvent intervenir en médiation ou ester en justice pour vous."},
        {"step": 5, "title": "Tribunal civil si nécessaire", "description": "Action en garantie des vices cachés ou en responsabilité du fait des produits défectueux."},
    ],
    "other": [
        {"step": 1, "title": "Précisez votre situation", "description": "Décrivez votre problème en détail pour identifier le domaine juridique concerné."},
        {"step": 2, "title": "Consultez un avocat généraliste", "description": "Il pourra vous orienter vers la bonne spécialité et évaluer votre dossier."},
        {"step": 3, "title": "Rassemblez vos documents", "description": "Tous documents liés à votre situation : contrats, courriers, preuves, actes officiels."},
        {"step": 4, "title": "Tentative amiable", "description": "Avant tout recours judiciaire, essayez de régler le différend à l'amiable."},
        {"step": 5, "title": "Recours judiciaire", "description": "Si aucune solution amiable, saisine du tribunal compétent selon la nature du litige."},
    ],
}


def get_roadmap(specialty: str) -> list:
    return LEGAL_ROADMAPS.get(specialty, LEGAL_ROADMAPS["other"])
