"""
cogs/cog_sync.py
─────────────────
Synchronisation des rôles en masse (utilise les IDs du .env) :

  /sync-tous     → Ré-attribue les rôles à tous les étudiants déjà vérifiés
  /sync-membre   → Resynchronise un seul membre
  /check-config  → Vérifie que tous les IDs du .env sont valides sur ce serveur
"""

import discord
from discord.ext import commands
from discord import app_commands
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import (
    load_students, load_used_matricules, get_student_by_matricule,
    add_used_matricule, get_groupe_td
)
from utils.roles_config import (
    get_role_td, get_role_miv, get_role_externe, verifier_config
)


class Sync(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot      = bot
        self.guild_id = int(os.getenv("GUILD_ID"))

    # ── Utilitaire : attribuer les rôles à un membre ───────────────────────────

    async def _attribuer(
        self, guild: discord.Guild, member: discord.Member,
        matricule: str, groupe_td: str
    ) -> str | None:
        """
        Attribue MIV + Groupe TD à un membre.
        Retourne un message d'erreur ou None si succès.
        """
        role_miv     = guild.get_role(get_role_miv())
        role_td      = guild.get_role(get_role_td(groupe_td))
        role_externe = guild.get_role(get_role_externe()) if get_role_externe() else None

        if not all([role_miv, role_td]):
            return f"`{matricule}` — rôle(s) introuvable(s) sur le serveur"

        try:
            if role_externe and role_externe in member.roles:
                await member.remove_roles(role_externe, reason="Étudiant vérifié")

            await member.add_roles(
                role_miv, role_td,
                reason=f"Sync automatique matricule {matricule}"
            )
            return None
        except discord.Forbidden:
            return f"`{matricule}` — permission insuffisante pour {member.mention}"
        except Exception as e:
            return f"`{matricule}` — {e}"

    # ══════════════════════════════════════════════════════════════════════════
    #  /check-config  — vérifie que les IDs du .env existent sur le serveur
    # ══════════════════════════════════════════════════════════════════════════

    @app_commands.command(
        name="check-config",
        description="[Admin] Vérifie que tous les IDs de rôles dans .env sont valides"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def check_config(self, interaction: discord.Interaction):
        erreurs = verifier_config(interaction.guild.roles)

        if not erreurs:
            await interaction.response.send_message(
                "✅ Configuration correcte ! Tous les rôles du `.env` existent sur ce serveur.",
                ephemeral=True
            )
        else:
            msg = "❌ **Erreurs de configuration :**\n\n" + "\n".join(erreurs)
            msg += "\n\n💡 Vérifie les IDs dans ton fichier `.env`."
            await interaction.response.send_message(msg, ephemeral=True)

    # ══════════════════════════════════════════════════════════════════════════
    #  /sync-tous  — ré-attribue les rôles à tous les étudiants déjà vérifiés
    # ══════════════════════════════════════════════════════════════════════════

    @app_commands.command(
        name="sync-tous",
        description="[Admin] Ré-attribue les rôles à tous les étudiants déjà vérifiés"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def sync_tous(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        guild     = interaction.guild
        etudiants = load_students()
        used      = load_used_matricules()

        ok = 0; skipped = 0; erreurs = []

        for matricule, info in used.items():
            member = guild.get_member(int(info["user_id"]))
            if not member:
                skipped += 1
                continue

            etudiant = get_student_by_matricule(matricule, etudiants)
            if not etudiant:
                erreurs.append(f"`{matricule}` — introuvable dans la liste")
                continue

            groupe_td = get_groupe_td(etudiant)

            err = await self._attribuer(guild, member, matricule, groupe_td)
            if err:
                erreurs.append(err)
            else:
                ok += 1

        embed = discord.Embed(title="🔄 Synchronisation terminée", color=discord.Color.blurple())
        embed.add_field(name="✅ Synchronisés",       value=str(ok),           inline=True)
        embed.add_field(name="👻 Absents du serveur", value=str(skipped),      inline=True)
        embed.add_field(name="❌ Erreurs",            value=str(len(erreurs)), inline=True)

        if erreurs:
            embed.add_field(
                name="Détail erreurs",
                value="\n".join(erreurs[:10]),
                inline=False
            )

        await interaction.followup.send(embed=embed, ephemeral=True)

    # ══════════════════════════════════════════════════════════════════════════
    #  /sync-membre  — resynchronise un seul membre
    # ══════════════════════════════════════════════════════════════════════════

    @app_commands.command(
        name="sync-membre",
        description="[Admin] Resynchronise les rôles d'un membre spécifique"
    )
    @app_commands.describe(membre="Le membre à synchroniser")
    @app_commands.checks.has_permissions(administrator=True)
    async def sync_membre(self, interaction: discord.Interaction, membre: discord.Member):
        await interaction.response.defer(ephemeral=True)

        etudiants = load_students()
        used      = load_used_matricules()

        matricule = next(
            (m for m, info in used.items() if info["user_id"] == str(membre.id)),
            None
        )
        if not matricule:
            await interaction.followup.send(
                f"❌ {membre.mention} n'a pas encore vérifié son matricule.", ephemeral=True
            )
            return

        etudiant = get_student_by_matricule(matricule, etudiants)
        if not etudiant:
            await interaction.followup.send(
                f"❌ Matricule `{matricule}` introuvable dans la liste.", ephemeral=True
            )
            return

        groupe_td = get_groupe_td(etudiant)

        err = await self._attribuer(interaction.guild, membre, matricule, groupe_td)
        if err:
            await interaction.followup.send(f"❌ Erreur : {err}", ephemeral=True)
        else:
            role_grp = interaction.guild.get_role(get_role_td(groupe_td))
            await interaction.followup.send(
                f"✅ {membre.mention} synchronisé :\n"
                f"👥 **{role_grp.name}**\n"
                f"🎓 Matricule : `{matricule}`",
                ephemeral=True
            )

    async def cog_app_command_error(self, interaction: discord.Interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Sync(bot))
