"""
cogs/cog_verification.py
────────────────────────
Flux de vérification — utilise les IDs de rôles définis dans .env :
  1. Étudiant écrit son matricule dans #ecrire-votre-matricule
  2. Message supprimé immédiatement
  3. DM avec ses infos (nom, prénom, section, groupe)
  4. OUI → enlève ROLE_EXTERNE, attribue ROLE_MIV + rôle section + rôle groupe
     NON → lui redemande d'écrire son vrai matricule
  5. Matricule déjà utilisé → dispatch "usurpation_attempt"
"""

import discord
from discord.ext import commands
import json
import asyncio
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import (
    load_students, get_student_by_matricule,
    is_matricule_used, get_matricule_info, add_used_matricule,
    get_groupe_td
)
from utils.roles_config import (
    get_role_td, get_role_miv, get_role_externe
)


class Verification(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot       = bot
        self.config    = self._load_config()
        self.etudiants = load_students()
        self.pending: set[int] = set()

    def _load_config(self) -> dict:
        with open("config.json", "r", encoding="utf-8") as f:
            return json.load(f)

    def reload_students(self):
        self.etudiants = load_students()

    async def _try_send_dm(self, member: discord.Member, content: str) -> bool:
        try:
            await member.send(content)
            return True
        except discord.Forbidden:
            return False

    # ── Listener principal ─────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot:
            return
        if message.channel.name != self.config["channels"]["verification"]:
            return

        member    = message.author
        matricule = message.content.strip()

        # Supprimer le message immédiatement
        try:
            await message.delete()
        except (discord.Forbidden, discord.NotFound):
            pass

        # Vérification déjà en cours pour cet utilisateur ?
        if member.id in self.pending:
            await self._try_send_dm(
                member,
                "⚠️ Tu as déjà une vérification en cours dans nos messages privés.\n"
                "Réponds **OUI** ou **NON** à mon dernier message."
            )
            return

        # Matricule déjà utilisé par quelqu'un d'autre ?
        if is_matricule_used(matricule):
            info = get_matricule_info(matricule) or {}
            self.bot.dispatch(
                "usurpation_attempt",
                message.guild, member, matricule,
                info.get("user_id", "?"), info.get("username", "?")
            )
            await self._try_send_dm(
                member,
                f"🚫 Le matricule **`{matricule}`** est déjà attribué à un autre compte.\n"
                "Si tu penses qu'il y a une erreur, contacte un administrateur."
            )
            return

        # Recherche dans la liste
        etudiant = get_student_by_matricule(matricule, self.etudiants)
        if etudiant is None:
            ok = await self._try_send_dm(
                member,
                f"❌ Matricule **`{matricule}`** introuvable.\n"
                f"Vérifie ton numéro et retourne dans **#{self.config['channels']['verification']}**."
            )
            if not ok:
                await message.channel.send(
                    f"{member.mention} Active les messages privés du serveur, puis réessaie.",
                    delete_after=10
                )
            return

        # Extraire les infos
        nom        = str(etudiant.get("nom",    "")).strip()
        prenom     = str(etudiant.get("prenom", "")).strip()
        specialite = str(etudiant.get("specialite", "")).strip().upper()
        groupe_td  = get_groupe_td(etudiant)

        # Vérifier que les rôles existent dans .env
        role_td_id  = get_role_td(groupe_td)
        role_miv_id = get_role_miv()

        manquants = []
        if not role_miv_id: manquants.append("ROLE_MIV")
        if not role_td_id:  manquants.append(f"ROLE_TD_{groupe_td}")

        if manquants:
            await self._try_send_dm(
                member,
                "⚙️ Configuration incomplète. Contacte un administrateur."
            )
            print(f"[Verification] ❌ IDs manquants dans .env : {', '.join(manquants)}")
            return

        # Envoyer la confirmation en DM
        ok = await self._try_send_dm(
            member,
            f"📋 **Vérification de ton identité**\n\n"
            f"Voici les informations associées à ce matricule :\n\n"
            f"👤 **Nom**       : {nom}\n"
            f"👤 **Prénom**    : {prenom}\n"
            f"🎓 **Matricule** : `{matricule}`\n"
            f"📚 **Spécialité** : {specialite}\n"
            f"👥 **Groupe TD**  : {groupe_td}\n\n"
            f"Ces informations sont-elles correctes ?\n"
            f"Réponds **OUI** pour confirmer ou **NON** pour annuler."
        )
        if not ok:
            await message.channel.send(
                f"{member.mention} ❌ Active les **Messages Privés** du serveur puis réessaie.",
                delete_after=15
            )
            return

        self.pending.add(member.id)

        def check_dm(m: discord.Message) -> bool:
            return (
                m.author.id == member.id
                and isinstance(m.channel, discord.DMChannel)
                and m.content.strip().upper() in ["OUI", "NON", "O", "N", "YES", "NO"]
            )

        try:
            reponse = await self.bot.wait_for(
                "message", check=check_dm,
                timeout=float(self.config.get("timeout_dm", 120))
            )
        except asyncio.TimeoutError:
            self.pending.discard(member.id)
            await self._try_send_dm(
                member,
                f"⏰ Temps écoulé ! Retourne dans **#{self.config['channels']['verification']}** pour réessayer."
            )
            return

        self.pending.discard(member.id)

        if reponse.content.strip().upper() in ["OUI", "O", "YES"]:
            guild = self.bot.get_guild(message.guild.id)
            await self._attribuer_roles(guild, member, matricule, nom, prenom, specialite, groupe_td)
        else:
            await self._try_send_dm(
                member,
                "❌ Vérification annulée.\n"
                f"Retourne dans **#{self.config['channels']['verification']}** et entre ton vrai matricule."
            )

    # ── Attribution des rôles par ID ───────────────────────────────────────────

    async def _attribuer_roles(
        self, guild: discord.Guild, member: discord.Member,
        matricule: str, nom: str, prenom: str, specialite: str, groupe_td: str
    ):
        # Récupérer les objets Role depuis leurs IDs
        role_miv     = guild.get_role(get_role_miv())
        role_td      = guild.get_role(get_role_td(groupe_td))
        role_externe = guild.get_role(get_role_externe()) if get_role_externe() else None

        roles_a_ajouter = [r for r in [role_miv, role_td] if r]

        if len(roles_a_ajouter) < 2:
            print(f"[Verification] ❌ Rôles introuvables sur le serveur pour {member} "
                  f"(MIV={role_miv}, TD={role_td})")
            await self._try_send_dm(member, "⚙️ Erreur de configuration. Contacte un administrateur.")
            return

        # Enlever le rôle "externe" si présent
        if role_externe and role_externe in member.roles:
            await member.remove_roles(role_externe, reason="Étudiant vérifié")

        # Enlever un ancien rôle de groupe TD s'il en avait déjà un
        td_ids = set()
        for i in range(1, 10):
            v = os.getenv(f"ROLE_TD_{i}")
            if v and v.strip().isdigit():
                td_ids.add(int(v))
        anciens_td = [r for r in member.roles if r.id in td_ids]
        if anciens_td:
            await member.remove_roles(*anciens_td, reason="Mise à jour groupe TD")

        # Attribuer : MIV + Groupe TD
        await member.add_roles(*roles_a_ajouter, reason=f"Vérification matricule {matricule}")

        # Persister
        add_used_matricule(matricule, member.id, str(member))

        # Confirmer en DM
        await self._try_send_dm(
            member,
            f"✅ **Vérification réussie !**\n\n"
            f"Tes rôles ont été attribués :\n"
            f"🎓 **{role_miv.name}**\n"
            f"👥 **{role_td.name}**\n\n"
            f"Bienvenue, {prenom} ! 🎉"
        )

        self.bot.dispatch(
            "verification_success",
            guild, member, matricule, nom, prenom, specialite, groupe_td
        )


async def setup(bot: commands.Bot):
    await bot.add_cog(Verification(bot))
