"""
cogs/cog_logs.py
─────────────────
Journal d'activité du bot :
  - Écoute "verification_success" et envoie un embed dans #logs-verifications
  - Chaque vérification réussie est tracée avec la date, l'utilisateur, la section et le groupe
"""

import discord
from discord.ext import commands
import json
import os
from datetime import datetime
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class Logs(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = self._load_config()

    def _load_config(self) -> dict:
        with open("config.json", "r", encoding="utf-8") as f:
            return json.load(f)

    # ── Listener : vérification réussie ───────────────────────────────────────

    @commands.Cog.listener()
    async def on_verification_success(
        self,
        guild: discord.Guild,
        member: discord.Member,
        matricule: str,
        nom: str,
        prenom: str,
        section: str,
        groupe: str
    ):
        logs_channel = discord.utils.get(
            guild.text_channels,
            name=self.config["channels"]["logs"]
        )
        if not logs_channel:
            print(f"[Logs] ⚠️ Salon '{self.config['channels']['logs']}' introuvable !")
            return

        now = datetime.now().strftime("%d/%m/%Y à %H:%M:%S")

        embed = discord.Embed(
            title="✅ Vérification réussie",
            color=discord.Color.green(),
            timestamp=datetime.now()
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="👤 Compte Discord", value=f"{member.mention}\n`{member}`", inline=True)
        embed.add_field(name="🎓 Matricule",       value=f"`{matricule}`",               inline=True)
        embed.add_field(name="📛 Nom complet",     value=f"{prenom} {nom}",              inline=True)
        embed.add_field(name="📚 Spécialité",      value=f"**{section}**",               inline=True)
        embed.add_field(name="👥 Groupe TD",       value=f"**Groupe {groupe}**",         inline=True)
        embed.set_footer(text=f"Vérification effectuée le {now}")

        await logs_channel.send(embed=embed)

    # ── Listener : membre qui quitte ─────────────────────────────────────────

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        """Log quand un étudiant vérifié quitte le serveur."""
        logs_channel = discord.utils.get(
            member.guild.text_channels,
            name=self.config["channels"]["logs"]
        )
        if not logs_channel:
            return

        # Vérifier s'il avait des rôles section/groupe (donc était vérifié)
        roles_etudiant = [r.name for r in member.roles
                          if r.name.startswith("Section ") or r.name.startswith("Groupe ")]
        if not roles_etudiant:
            return

        embed = discord.Embed(
            title="🚪 Étudiant vérifié a quitté",
            color=discord.Color.orange(),
            timestamp=datetime.now()
        )
        embed.add_field(name="👤 Utilisateur",  value=f"`{member}`",            inline=True)
        embed.add_field(name="🎭 Rôles perdus", value=", ".join(roles_etudiant), inline=False)
        embed.set_footer(text="Son matricule reste bloqué. Utilise /reset-matricule si nécessaire.")

        await logs_channel.send(embed=embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(Logs(bot))
