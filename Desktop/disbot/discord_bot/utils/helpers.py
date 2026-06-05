"""
utils/helpers.py
─────────────────
Utilitaires partagés : parsing de durées, formatage, chargement JSON.
"""

import re
import json
import os
from datetime import datetime

UNITS = {'s': 1, 'm': 60, 'h': 3600, 'd': 86400, 'w': 604800}

def parse_duration(s: str) -> int | None:
    """
    Convertit une durée textuelle en secondes.
    Exemples : '10m' → 600 | '2h' → 7200 | '7d' → 604800
    Retourne None si le format est invalide.
    """
    match = re.fullmatch(r'(\d+)([smhdw])', s.strip().lower())
    if not match:
        return None
    return int(match.group(1)) * UNITS[match.group(2)]

def format_duration(seconds: int) -> str:
    """Convertit des secondes en texte lisible. Ex: 3661 → '1h 1m 1s'"""
    parts = []
    for unit, label in [(86400, 'j'), (3600, 'h'), (60, 'm'), (1, 's')]:
        if seconds >= unit:
            parts.append(f"{seconds // unit}{label}")
            seconds %= unit
    return ' '.join(parts) if parts else '0s'

def load_json(path: str, default=None):
    """Charge un fichier JSON, retourne default si absent."""
    if default is None:
        default = {}
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_json(path: str, data):
    """Sauvegarde dans un fichier JSON."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def load_config() -> dict:
    with open("config.json", "r", encoding="utf-8") as f:
        return json.load(f)
