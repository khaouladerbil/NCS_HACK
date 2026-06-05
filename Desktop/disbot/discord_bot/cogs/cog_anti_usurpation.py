"""
cogs/cog_anti_usurpation.py
────────────────────────────
Détection et alerte des tentatives d'usurpation de matricule :
  - Écoute l'événement "usurpation_attempt" déclenché par cog_verification
  - Envoie une alerte dans le salon #alertes-admin
  - Enregistre chaque tentative dans data/usurpations.json
  - Commande admin /historique-usurpations pour consulter les tentatives
"""

import discord
from discord.ext import commands
from discord import app_commands
import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import save_usurpation, load_usurpations, load_students, get_student_by_matricule


class AntiUsurpation(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = self._load_config()
        self.guild_id = int(os.getenv("GUILD_ID"))

    def _load_config(self) -> dict:
        with open("config.json", "r", encoding="utf-8") as f:
            return json.load(f)

    # ── Listener : réception de l'événement usurpation_attempt ────────────────

    @commands.Cog.listener()
    async def on_usurpation_attempt(
        self,
        guild: discord.Guild,
        suspect: discord.Member,
        matricule: str,
        owner_id: str,
        owner_name: str
    ):
        # 1. Enregistrer dans le fichier JSON
        save_usurpation(guild.id, suspect.id, str(suspect), matricule, owner_id)

        # 2. Chercher le salon d'alertes
        alerte_channel = discord.utils.get(
            guild.text_channels,
            name=self.config["channels"]["alertes"]
        )
        if not alerte_channel:
            print(f"[AntiUsurpation] ⚠️ Salon '{self.config['channels']['alertes']}' introuvable !")
            return

        # 3. Construire l'embed d'alerte
        embed = discord.Embed(
            title="🚨 Tentative d'usurpation de matricule",
            color=discord.Color.red()
        )
        embed.add_field(name="👤 Suspect",    value=f"{suspect.mention}\n`{suspect}`", inline=True)
        embed.add_field(name="🎓 Matricule",  value=f"`{matricule}`",                  inline=True)
        embed.add_field(name="⚠️ Déjà attribué à", value=f"ID Discord : `{owner_id}`\n{owner_name}", inline=False)

        # Essayer de mentionner le vrai propriétaire
        owner_member = guild.get_member(int(owner_id)) if owner_id.isdigit() else None
        if owner_member:
            embed.add_field(name="✅ Propriétaire légitime", value=owner_member.mention, inline=False)

        embed.set_footer(text="Vérifie s'il s'agit d'une erreur ou d'une tentative malveillante.")

        await alerte_channel.send(embed=embed)

    # ── Commande /historique-usurpations (admin) ───────────────────────────────

    @app_commands.command(
        name="historique-usurpations",
        description="[Admin] Affiche les dernières tentatives d'usurpation de matricule"
    )
    @app_commands.describe(limite="Nombre de tentatives à afficher (défaut : 10)")
    @app_commands.checks.has_permissions(administrator=True)
    async def historique_usurpations(self, interaction: discord.Interaction, limite: int = 10):
        await interaction.response.defer(ephemeral=True)

        tentatives = load_usurpations()
        if not tentatives:
            await interaction.followup.send("✅ Aucune tentative d'usurpation enregistrée.", ephemeral=True)
            return

        # Trier du plus récent au plus ancien
        tentatives = sorted(tentatives, key=lambda x: x.get("timestamp", ""), reverse=True)
        tentatives = tentatives[:limite]

        embed = discord.Embed(
            title=f"🚨 Historique des usurpations ({len(tentatives)} dernières)",
            color=discord.Color.orange()
        )

        for t in tentatives:
            date = t.get("timestamp", "")[:19].replace("T", " ")
            embed.add_field(
                name=f"📅 {date}",
                value=(
                    f"**Suspect** : `{t.get('suspect_name','?')}` (ID: `{t.get('suspect_id','?')}`)\n"
                    f"**Matricule** : `{t.get('matricule','?')}`\n"
                    f"**Propriétaire** : ID `{t.get('owner_id','?')}`"
                ),
                inline=False
            )

        await interaction.followup.send(embed=embed, ephemeral=True)

    @historique_usurpations.error
    async def perm_error(self, interaction: discord.Interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(AntiUsurpation(bot))
