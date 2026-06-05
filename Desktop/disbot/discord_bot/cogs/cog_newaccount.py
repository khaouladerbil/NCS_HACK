"""
cogs/cog_newaccount.py
───────────────────────
Filtre les comptes trop récents à l'arrivée :
  - Action configurable : "quarantine" (rôle) ou "kick"
  - Âge minimum configurable dans config.json → newaccount.min_age_days
  - Alerte admin dans #logs-admin
  - /set-age-minimum JOURS  → modifier l'âge minimum à la volée
"""

import discord
from discord.ext import commands
from discord import app_commands
from datetime import datetime, timezone, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import load_config


class NewAccount(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()

    def _cfg(self) -> dict:
        return self.config.get("newaccount", {
            "min_age_days":    7,
            "action":          "quarantine",
            "quarantine_role": "Quarantaine"
        })

    async def _alert(self, guild: discord.Guild, member: discord.Member, action: str, age_days: int):
        ch = discord.utils.get(guild.text_channels, name=self.config["channels"]["logs_admin"])
        if not ch:
            return
        embed = discord.Embed(
            title="⚠️ Compte récent détecté",
            color=discord.Color.orange(),
            timestamp=datetime.now()
        )
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="Membre",         value=f"{member.mention} `{member}`", inline=True)
        embed.add_field(name="ID",             value=f"`{member.id}`",               inline=True)
        embed.add_field(name="Âge du compte",  value=f"**{age_days}** jour(s)",      inline=True)
        embed.add_field(name="Action",         value=f"**{action}**",                inline=True)
        await ch.send(embed=embed)

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        if member.bot:
            return

        cfg        = self._cfg()
        min_days   = cfg.get("min_age_days", 7)
        action     = cfg.get("action", "quarantine")
        q_role_name = cfg.get("quarantine_role", "Quarantaine")

        created  = member.created_at
        age_days = (datetime.now(timezone.utc) - created).days

        if age_days >= min_days:
            return

        # DM à la personne
        try:
            await member.send(
                f"⚠️ **Ton compte Discord est trop récent pour rejoindre {member.guild.name}.**\n\n"
                f"**Âge de ton compte :** {age_days} jour(s)\n"
                f"**Âge minimum requis :** {min_days} jour(s)\n\n"
                f"Reviens dans {min_days - age_days} jour(s) ou contacte un administrateur."
            )
        except discord.Forbidden:
            pass

        if action == "kick":
            await self._alert(member.guild, member, "Kick automatique", age_days)
            try:
                await member.kick(reason=f"Compte trop récent : {age_days}j < {min_days}j requis")
            except discord.Forbidden:
                pass

        elif action == "quarantine":
            q_role = discord.utils.get(member.guild.roles, name=q_role_name)
            if not q_role:
                try:
                    q_role = await member.guild.create_role(
                        name=q_role_name,
                        reason="Rôle quarantaine créé automatiquement",
                        color=discord.Color.dark_grey()
                    )
                    # Retirer l'accès à tous les salons
                    for ch in member.guild.text_channels:
                        await ch.set_permissions(q_role, send_messages=False, read_messages=False)
                except discord.Forbidden:
                    pass

            if q_role:
                try:
                    await member.add_roles(q_role, reason=f"Compte récent : {age_days}j < {min_days}j")
                except discord.Forbidden:
                    pass

            await self._alert(member.guild, member, f"Quarantaine ({q_role_name})", age_days)

    # ── /set-age-minimum ───────────────────────────────────────────────────────

    @app_commands.command(name="set-age-minimum", description="[Admin] Modifier l'âge minimum des comptes autorisés")
    @app_commands.describe(jours="Âge minimum en jours (0 = désactivé)")
    @app_commands.checks.has_permissions(administrator=True)
    async def set_age(self, interaction: discord.Interaction, jours: int):
        import json
        with open("config.json", "r", encoding="utf-8") as f:
            cfg = json.load(f)
        if "newaccount" not in cfg:
            cfg["newaccount"] = {}
        cfg["newaccount"]["min_age_days"] = jours
        with open("config.json", "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)

        self.config = cfg
        msg = f"✅ Âge minimum mis à jour : **{jours} jour(s)**." if jours > 0 else "✅ Filtre désactivé (âge minimum = 0)."
        await interaction.response.send_message(msg, ephemeral=True)

    async def cog_app_command_error(self, interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(NewAccount(bot))
