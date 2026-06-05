"""
utils/roles_config.py
──────────────────────
Fait le lien entre les valeurs du CSV (section, groupe)
et les IDs de rôles Discord définis dans le fichier .env.

Comment ajouter un nouveau groupe ou une section :
  1. Ajoute une ligne dans .env :  ROLE_GRP_G4=1234567890
  2. C'est tout — le bot la lit automatiquement.
"""

import os
from dotenv import load_dotenv

load_dotenv()


def _to_int(val: str | None) -> int | None:
    """Convertit une valeur .env en int, ou retourne None si absente/invalide."""
    if val and val.strip().isdigit():
        return int(val.strip())
    return None


def get_role_groupe(groupe: str) -> int | None:
    """
    Retourne l'ID Discord du rôle correspondant au groupe.
    Ex: groupe='G1' → cherche ROLE_GRP_G1 dans .env
    """
    key = f"ROLE_GRP_{groupe.strip().upper()}"
    val = os.getenv(key)
    if not val:
        print(f"[RolesConfig] ⚠️  Variable manquante dans .env : {key}")
    return _to_int(val)


def get_role_td(groupe_td: str) -> int | None:
    """
    Retourne l'ID Discord du rôle correspondant au groupe TD.
    Ex: groupe_td='1' → cherche ROLE_TD_1 dans .env
    Tolère les valeurs du type '1.0' venant d'un export.
    """
    num = str(groupe_td).strip()
    if num.endswith(".0"):
        num = num[:-2]
    key = f"ROLE_TD_{num}"
    val = os.getenv(key)
    if not val:
        print(f"[RolesConfig] ⚠️  Variable manquante dans .env : {key}")
    return _to_int(val)


def get_role_section(section: str) -> int | None:
    """
    Retourne l'ID Discord du rôle correspondant à la section.
    Ex: section='A' → cherche ROLE_SECTION_A dans .env
    """
    key = f"ROLE_SECTION_{section.strip().upper()}"
    val = os.getenv(key)
    if not val:
        print(f"[RolesConfig] ⚠️  Variable manquante dans .env : {key}")
    return _to_int(val)


def get_role_miv() -> int | None:
    """Rôle attribué à tous les étudiants vérifiés (ex: MIV)."""
    return _to_int(os.getenv("ROLE_MIV"))


def get_role_externe() -> int | None:
    """Rôle des membres non encore vérifiés."""
    return _to_int(os.getenv("ROLE_EXTERNE"))


def verifier_config(guild_roles: list) -> list[str]:
    """
    Vérifie que tous les IDs définis dans .env correspondent
    à des rôles qui existent sur le serveur.
    Retourne la liste des erreurs trouvées.
    """
    guild_role_ids = {r.id for r in guild_roles}
    erreurs = []

    checks = {
        "ROLE_MIV":     get_role_miv(),
        "ROLE_EXTERNE": get_role_externe(),
    }

    # Vérifier tous les ROLE_TD_* et ROLE_TP_* définis
    for key, val in os.environ.items():
        if key.startswith("ROLE_TD_") or key.startswith("ROLE_TP_"):
            role_id = _to_int(val)
            if role_id:
                checks[key] = role_id

    for key, role_id in checks.items():
        if role_id is None:
            erreurs.append(f"❌ {key} non défini dans .env")
        elif role_id not in guild_role_ids:
            erreurs.append(f"❌ {key}={role_id} — rôle introuvable sur le serveur")

    return erreurs
