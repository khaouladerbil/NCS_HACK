"""
cogs/cog_mute.py
─────────────────
Mute temporaire via Discord Timeout :
  /mute @membre DURÉE RAISON   → timeout (ex: 10m, 2h, 1d)
  /unmute @membre              → lever le timeout
"""

import discord
from discord.ext import commands
from discord import app_commands
from datetime import datetime, timezone, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import parse_duration, format_duration, load_config


class Mute(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()

    async def _log(self, guild: discord.Guild, embed: discord.Embed):
        ch = discord.utils.get(guild.text_channels, name=self.config["channels"]["logs_admin"])
        if ch:
            await ch.send(embed=embed)

    # ── /mute ──────────────────────────────────────────────────────────────────

    @app_commands.command(name="mute", description="[Mod] Rendre muet un membre temporairement")
    @app_commands.describe(
        membre="Le membre à muter",
        duree="Durée : 10m, 2h, 1d, 1w (max 28j)",
        raison="La raison du mute"
    )
    @app_commands.checks.has_permissions(moderate_members=True)
    async def mute(self, interaction: discord.Interaction, membre: discord.Member, duree: str, raison: str = "Aucune raison"):
        await interaction.response.defer(ephemeral=True)

        if membre.bot:
            await interaction.followup.send("❌ Impossible de muter un bot.", ephemeral=True)
            return
        if membre.top_role >= interaction.user.top_role:
            await interaction.followup.send("❌ Rôle insuffisant pour muter ce membre.", ephemeral=True)
            return

        seconds = parse_duration(duree)
        if not seconds:
            await interaction.followup.send(
                "❌ Format de durée invalide.\nExemples valides : `10m`, `2h`, `1d`, `1w`", ephemeral=True
            )
            return

        MAX = 28 * 86400
        if seconds > MAX:
            await interaction.followup.send("❌ Durée maximale : 28 jours.", ephemeral=True)
            return

        until = datetime.now(timezone.utc) + timedelta(seconds=seconds)

        try:
            await membre.timeout(until, reason=f"{raison} | Par {interaction.user}")
        except discord.Forbidden:
            await interaction.followup.send("❌ Je n'ai pas la permission de muter ce membre.", ephemeral=True)
            return

        duree_txt = format_duration(seconds)

        # DM à la personne
        try:
            await membre.send(
                f"🔇 **Tu as été mis en sourdine sur {interaction.guild.name}**\n\n"
                f"**Durée :** {duree_txt}\n"
                f"**Raison :** {raison}\n"
                f"**Modérateur :** {interaction.user}\n"
                f"**Fin :** <t:{int(until.timestamp())}:F>"
            )
        except discord.Forbidden:
            pass

        # Log admin
        embed = discord.Embed(title="🔇 Mute temporaire", color=discord.Color.red(), timestamp=datetime.now())
        embed.set_thumbnail(url=membre.display_avatar.url)
        embed.add_field(name="Membre",      value=f"{membre.mention} `{membre}`", inline=True)
        embed.add_field(name="Durée",       value=duree_txt,                      inline=True)
        embed.add_field(name="Fin",         value=f"<t:{int(until.timestamp())}:R>", inline=True)
        embed.add_field(name="Raison",      value=raison,                         inline=False)
        embed.set_footer(text=f"Par {interaction.user}")
        await self._log(interaction.guild, embed)

        await interaction.followup.send(
            f"🔇 {membre.mention} est mute pour **{duree_txt}**.", ephemeral=True
        )

    # ── /unmute ────────────────────────────────────────────────────────────────

    @app_commands.command(name="unmute", description="[Mod] Lever le mute d'un membre")
    @app_commands.describe(membre="Le membre à démuter")
    @app_commands.checks.has_permissions(moderate_members=True)
    async def unmute(self, interaction: discord.Interaction, membre: discord.Member):
        await interaction.response.defer(ephemeral=True)

        if not membre.is_timed_out():
            await interaction.followup.send(f"ℹ️ {membre.mention} n'est pas muté.", ephemeral=True)
            return

        try:
            await membre.timeout(None, reason=f"Mute levé par {interaction.user}")
        except discord.Forbidden:
            await interaction.followup.send("❌ Permission insuffisante.", ephemeral=True)
            return

        try:
            await membre.send(f"🔊 Ton mute sur **{interaction.guild.name}** a été levé par {interaction.user}.")
        except discord.Forbidden:
            pass

        embed = discord.Embed(title="🔊 Mute levé", color=discord.Color.green(), timestamp=datetime.now())
        embed.add_field(name="Membre", value=f"{membre.mention} `{membre}`", inline=True)
        embed.set_footer(text=f"Par {interaction.user}")
        await self._log(interaction.guild, embed)

        await interaction.followup.send(f"🔊 Mute de {membre.mention} levé.", ephemeral=True)

    async def cog_app_command_error(self, interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Mute(bot))
