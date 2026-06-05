# 🤖 Bot Discord — Attribution des Rôles Étudiants

Ce bot Discord attribue automatiquement les rôles **Section** et **Groupe** à chaque étudiant
en fonction de son matricule, en le comparant à la liste officielle.

---

## 📁 Structure des fichiers

```
discord_bot/
├── bot.py              ← Code principal du bot
├── etudiants.csv       ← Liste des étudiants (ou .xlsx)
├── .env                ← Token et ID du serveur (ne pas partager !)
├── requirements.txt    ← Dépendances Python
└── README.md
```

---

## ⚙️ Installation

### 1. Installe les dépendances
```bash
pip install -r requirements.txt
```

### 2. Prépare le fichier `.env`
Ouvre `.env` et remplis les deux valeurs :
```env
DISCORD_TOKEN=TON_TOKEN_ICI
GUILD_ID=ID_DE_TON_SERVEUR
```

> **Où trouver ces valeurs ?**
> - **Token** : [Discord Developer Portal](https://discord.com/developers/applications) → ton app → Bot → Reset Token
> - **Guild ID** : Clic droit sur ton serveur Discord → "Copier l'identifiant du serveur" (activer le mode développeur dans les paramètres)

### 3. Prépare la liste des étudiants

#### Option A — Fichier CSV (`etudiants.csv`)
```csv
matricule,nom,prenom,section,groupe
231411001,Benali,Ahmed,A,G1
231411002,Boudiaf,Sara,B,G2
```

#### Option B — Fichier Excel (`etudiants.xlsx`)
Même structure, avec les colonnes : `matricule`, `nom`, `prenom`, `section`, `groupe`

> ⚠️ Le fichier Excel est prioritaire sur le CSV si les deux sont présents.

### 4. Lance le bot
```bash
python bot.py
```

---

## 🎮 Commandes disponibles

| Commande | Accès | Description |
|---|---|---|
| `/verify <matricule>` | Tous | Vérifie le matricule et attribue les rôles |
| `/reload` | Admin | Recharge la liste des étudiants |
| `/info <matricule>` | Admin | Affiche les infos d'un étudiant |

---

## 🔐 Permissions requises pour le bot

Dans le **Discord Developer Portal**, active ces **Privileged Gateway Intents** :
- ✅ `SERVER MEMBERS INTENT`
- ✅ `MESSAGE CONTENT INTENT`

Et donne ces permissions au bot lors de l'invitation :
- ✅ `Manage Roles`
- ✅ `Send Messages`
- ✅ `Use Slash Commands`

> ⚠️ Le rôle du bot doit être **au-dessus** des rôles Section/Groupe dans la hiérarchie du serveur.

---

## 🔗 Inviter le bot sur ton serveur

Dans le Developer Portal → OAuth2 → URL Generator :
- Scope : `bot` + `applications.commands`
- Permissions : `Manage Roles`, `Send Messages`

Copie le lien généré et ouvre-le dans ton navigateur.

---

## 🧪 Exemple d'utilisation

Un étudiant tape dans Discord :
```
/verify 231411001
```

Le bot répond (visible uniquement par lui) :
```
✅ Vérification réussie !

👤 Ahmed Benali
🎓 Matricule : 231411001
📚 Section : A
👥 Groupe : G1

Tes rôles Section A et Groupe G1 ont été attribués !
```
