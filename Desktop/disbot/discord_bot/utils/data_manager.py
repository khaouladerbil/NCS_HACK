"""
utils/data_manager.py
──────────────────────
Supporte 3 sources de données (par ordre de priorité) :
  1. GOOGLE_SHEET_URL dans .env  → lit le Google Sheet directement
  2. etudiants.xlsx              → fichier Excel local
  3. etudiants.csv               → fichier CSV local
"""

import pandas as pd
import json, os, re, unicodedata
from pathlib import Path
from datetime import datetime

STUDENTS_XLSX        = "etudiants.xlsx"
STUDENTS_CSV         = "etudiants.csv"
USED_MATRICULES_PATH = "data/used_matricules.json"
USURPATIONS_PATH     = "data/usurpations.json"

COLUMN_MAP = {
    "matricule":  "matricule",
    "nom":        "nom",
    "prenom":     "prenom",
    "prénom":     "prenom",
    "section":    "section",
    "groupetd":   "groupe_td",
    "groupe td":  "groupe_td",
    "groupetp":   "groupe_tp",
    "groupe tp":  "groupe_tp",
    "etat":       "etat",
    "état":       "etat",
    "palier":     "palier",
    "specialite": "specialite",
    "spécialité": "specialite",
    "specialité": "specialite",
    "spécialite": "specialite",
}

def _normalize(s: str) -> str:
    s = s.strip().lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s

def _rename_columns(df: pd.DataFrame) -> pd.DataFrame:
    new_cols = {}
    for col in df.columns:
        n = _normalize(col)
        new_cols[col] = COLUMN_MAP.get(n, n)
    return df.rename(columns=new_cols)

def _promote_header_row(df: pd.DataFrame) -> pd.DataFrame:
    """
    Certains exports (Google Sheet de la fac) ont plusieurs lignes de titre
    avant la vraie ligne d'en-tête (« N°, Palier, …, Matricule, … »).
    On détecte la première ligne contenant « matricule » et on l'utilise
    comme en-tête, en jetant tout ce qui est au-dessus.
    """
    if "matricule" in [_normalize(str(c)) for c in df.columns]:
        return df  # l'en-tête est déjà correct

    for idx in range(len(df)):
        cells = [_normalize(str(v)) for v in df.iloc[idx].tolist()]
        if "matricule" in cells:
            new_df = df.iloc[idx + 1:].copy()
            new_df.columns = df.iloc[idx].tolist()
            return new_df.reset_index(drop=True)
    return df  # pas trouvé : on laisse _rename_columns lever l'erreur

def _sheet_url_to_csv(url: str) -> str:
    """
    Convertit n'importe quel lien Google Sheet en URL d'export CSV.
    Accepte :
      - https://docs.google.com/spreadsheets/d/ID/edit?usp=sharing
      - https://docs.google.com/spreadsheets/d/ID/edit#gid=0
      - https://docs.google.com/spreadsheets/d/ID/pub...
    """
    match = re.search(r'/spreadsheets/d/([a-zA-Z0-9_-]+)', url)
    if not match:
        raise ValueError("❌ URL Google Sheet invalide. Copie l'URL depuis Fichier → Partager → Copier le lien.")
    sheet_id = match.group(1)

    # Extraire le gid (onglet) si présent
    gid_match = re.search(r'gid=(\d+)', url)
    gid = gid_match.group(1) if gid_match else "0"

    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"

# ══════════════════════════════════════════════════════════════════════════════

def load_students() -> pd.DataFrame:
    from dotenv import load_dotenv
    load_dotenv()

    sheet_url = os.getenv("GOOGLE_SHEET_URL", "").strip()

    if sheet_url:
        # ── Source 1 : Google Sheet ───────────────────────────────────────────
        print("[DataManager] 📡 Chargement depuis Google Sheet...")
        try:
            csv_url = _sheet_url_to_csv(sheet_url)
            df = pd.read_csv(csv_url, dtype=str)
            print(f"[DataManager] ✅ Google Sheet chargé — {len(df)} lignes")
        except Exception as e:
            raise ConnectionError(
                f"❌ Impossible de lire le Google Sheet.\n"
                f"Vérifie que le sheet est bien PUBLIC (Partage → Tout le monde avec le lien).\n"
                f"Erreur : {e}"
            )
    elif os.path.exists(STUDENTS_XLSX):
        # ── Source 2 : Excel local ────────────────────────────────────────────
        print("[DataManager] 📂 Chargement depuis etudiants.xlsx...")
        df = pd.read_excel(STUDENTS_XLSX, dtype=str)
    elif os.path.exists(STUDENTS_CSV):
        # ── Source 3 : CSV local ──────────────────────────────────────────────
        print("[DataManager] 📂 Chargement depuis etudiants.csv...")
        df = pd.read_csv(STUDENTS_CSV, dtype=str)
    else:
        raise FileNotFoundError(
            "❌ Aucune source de données trouvée.\n"
            "Ajoute GOOGLE_SHEET_URL dans .env, ou place etudiants.xlsx dans le dossier."
        )

    df = _promote_header_row(df)
    df = _rename_columns(df)

    if "matricule" not in df.columns:
        raise ValueError(
            f"❌ Colonne 'Matricule' introuvable.\n"
            f"Colonnes trouvées : {list(df.columns)}"
        )

    df["matricule"] = df["matricule"].astype(str).str.strip()

    if "groupe_td" not in df.columns and "groupe" in df.columns:
        df["groupe_td"] = df["groupe"]
    if "groupe_tp" not in df.columns:
        df["groupe_tp"] = None

    df = df[df["matricule"].str.len() > 0].reset_index(drop=True)
    print(f"[DataManager] ✅ {len(df)} étudiants chargés")
    return df


def get_student_by_matricule(matricule: str, df: pd.DataFrame):
    result = df[df["matricule"] == matricule.strip()]
    return result.iloc[0] if not result.empty else None

def get_groupe_td(row) -> str:
    val = row.get("groupe_td", "")
    if val is None or str(val).strip() in ("", "nan", "None"): return ""
    return str(val).strip()

def get_groupe_tp(row) -> str:
    val = row.get("groupe_tp", "")
    if val is None or str(val).strip() in ("", "nan", "None"): return ""
    return str(val).strip()

# ══════════════════════════════════════════════════════════════════════════════

def _ensure_data_dir():
    Path("data").mkdir(exist_ok=True)

def load_used_matricules() -> dict:
    _ensure_data_dir()
    if not os.path.exists(USED_MATRICULES_PATH): return {}
    with open(USED_MATRICULES_PATH, "r", encoding="utf-8") as f: return json.load(f)

def save_used_matricules(data: dict):
    _ensure_data_dir()
    with open(USED_MATRICULES_PATH, "w", encoding="utf-8") as f: json.dump(data, f, indent=2, ensure_ascii=False)

def add_used_matricule(matricule: str, user_id: int, username: str = ""):
    data = load_used_matricules()
    data[matricule] = {"user_id": str(user_id), "username": username, "timestamp": datetime.now().isoformat()}
    save_used_matricules(data)

def remove_used_matricule(matricule: str) -> bool:
    data = load_used_matricules()
    if matricule in data:
        del data[matricule]; save_used_matricules(data); return True
    return False

def is_matricule_used(matricule: str) -> bool:
    return matricule in load_used_matricules()

def get_matricule_info(matricule: str) -> dict | None:
    return load_used_matricules().get(matricule)

def load_usurpations() -> list:
    _ensure_data_dir()
    if not os.path.exists(USURPATIONS_PATH): return []
    with open(USURPATIONS_PATH, "r", encoding="utf-8") as f: return json.load(f)

def save_usurpation(guild_id, suspect_id, suspect_name, matricule, owner_id):
    data = load_usurpations()
    data.append({"timestamp": datetime.now().isoformat(), "guild_id": str(guild_id),
                 "suspect_id": str(suspect_id), "suspect_name": suspect_name,
                 "matricule": matricule, "owner_id": owner_id})
    _ensure_data_dir()
    with open(USURPATIONS_PATH, "w", encoding="utf-8") as f: json.dump(data, f, indent=2, ensure_ascii=False)