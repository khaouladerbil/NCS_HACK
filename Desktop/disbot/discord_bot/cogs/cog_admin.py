"""
cogs/cog_admin.py
──────────────────
Commandes d'administration (réservées aux admins) :
  /reset-matricule      → libère un matricule bloqué
  /forcer-verification  → attribue les rôles à un membre manuellement
  /liste-non-verifies   → affiche les étudiants sans rôles
  /reload-liste         → recharge le fichier étudiants sans redémarrer
"""

import discord
from discord.ext import commands
from discord import app_commands
import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import (
    remove_used_matricule, load_used_matricules,
    load_students, get_student_by_matricule, add_used_matricule,
    get_groupe_td
)
from utils.roles_config import get_role_td, get_role_miv, get_role_externe


class Admin(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot      = bot
        self.guild_id = int(os.getenv("GUILD_ID"))

    # ── /reset-matricule ───────────────────────────────────────────────────────

    @app_commands.command(
        name="reset-matricule",
        description="[Admin] Libère un matricule bloqué pour permettre une nouvelle vérification"
    )
    @app_commands.describe(matricule="Le matricule à libérer")
    @app_commands.checks.has_permissions(administrator=True)
    async def reset_matricule(self, interaction: discord.Interaction, matricule: str):
        matricule = matricule.strip()
        if remove_used_matricule(matricule):
            await interaction.response.send_message(
                f"✅ Matricule `{matricule}` libéré. L'étudiant peut se re-vérifier.",
                ephemeral=True
            )
        else:
            await interaction.response.send_message(
                f"❌ Matricule `{matricule}` non trouvé dans la liste des attribués.",
                ephemeral=True
            )

    # ── /forcer-verification ───────────────────────────────────────────────────

    @app_commands.command(
        name="forcer-verification",
        description="[Admin] Attribue les rôles d'un étudiant manuellement"
    )
    @app_commands.describe(
        membre="Le membre Discord à qui attribuer les rôles",
        matricule="Son numéro de matricule"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def forcer_verification(
        self,
        interaction: discord.Interaction,
        membre: discord.Member,
        matricule: str
    ):
        await interaction.response.defer(ephemeral=True)

        matricule = matricule.strip()
        etudiants = load_students()
        etudiant  = get_student_by_matricule(matricule, etudiants)

        if etudiant is None:
            await interaction.followup.send(
                f"❌ Matricule `{matricule}` introuvable dans la liste.",
                ephemeral=True
            )
            return

        nom       = str(etudiant.get("nom",    "")).strip()
        prenom    = str(etudiant.get("prenom", "")).strip()
        groupe_td = get_groupe_td(etudiant)
        guild     = interaction.guild

        # Récupérer les rôles depuis les IDs du .env
        role_miv     = guild.get_role(get_role_miv())
        role_td      = guild.get_role(get_role_td(groupe_td))
        role_externe = guild.get_role(get_role_externe()) if get_role_externe() else None

        if not all([role_miv, role_td]):
            await interaction.followup.send(
                f"❌ Rôle(s) introuvable(s) sur le serveur (MIV={role_miv}, TD groupe {groupe_td}={role_td}).\n"
                f"Vérifie les IDs dans `.env` avec `/check-config`.",
                ephemeral=True
            )
            return

        if role_externe and role_externe in membre.roles:
            await membre.remove_roles(role_externe, reason="Forçage admin — étudiant vérifié")

        await membre.add_roles(role_miv, role_td, reason=f"Forçage admin par {interaction.user}")
        add_used_matricule(matricule, membre.id, str(membre))

        await interaction.followup.send(
            f"✅ Rôles attribués à {membre.mention} :\n"
            f"🎓 **{role_miv.name}** | 👥 **{role_td.name}**\n"
            f"📛 {prenom} {nom} — `{matricule}`",
            ephemeral=True
        )

    # ── /liste-non-verifies ────────────────────────────────────────────────────

    @app_commands.command(
        name="liste-non-verifies",
        description="[Admin] Liste les membres du serveur qui n'ont pas encore vérifié"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def liste_non_verifies(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        guild        = interaction.guild
        used         = load_used_matricules()
        verifies_ids = {int(info["user_id"]) for info in used.values()}
        miv_id       = get_role_miv()

        non_verifies = [
            m for m in guild.members
            if not m.bot
            and m.id not in verifies_ids
            and not any(r.id == miv_id for r in m.roles)
        ]

        if not non_verifies:
            await interaction.followup.send("✅ Tous les membres sont vérifiés !", ephemeral=True)
            return

        # Découper en pages de 20
        pages = [non_verifies[i:i+20] for i in range(0, len(non_verifies), 20)]
        embed = discord.Embed(
            title=f"⏳ Membres non vérifiés ({len(non_verifies)} au total)",
            color=discord.Color.yellow()
        )

        liste_text = "\n".join(f"• {m.mention} `{m}`" for m in pages[0])
        if len(pages) > 1:
            liste_text += f"\n_... et {len(non_verifies)-20} autres (affichage limité)_"

        embed.description = liste_text
        await interaction.followup.send(embed=embed, ephemeral=True)

    # ── /reload-liste ──────────────────────────────────────────────────────────

    @app_commands.command(
        name="reload-liste",
        description="[Admin] Recharge le fichier étudiants (CSV ou Excel) sans redémarrer le bot"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def reload_liste(self, interaction: discord.Interaction):
        try:
            verif_cog = self.bot.cogs.get("Verification")
            if verif_cog:
                verif_cog.reload_students()
                etudiants = verif_cog.etudiants
                await interaction.response.send_message(
                    f"✅ Liste rechargée : **{len(etudiants)}** étudiants en mémoire.",
                    ephemeral=True
                )
            else:
                await interaction.response.send_message(
                    "❌ Cog de vérification introuvable.",
                    ephemeral=True
                )
        except Exception as e:
            await interaction.response.send_message(f"❌ Erreur : `{e}`", ephemeral=True)

    # ── Gestion des erreurs de permission ─────────────────────────────────────

    async def cog_app_command_error(self, interaction: discord.Interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Admin(bot))
