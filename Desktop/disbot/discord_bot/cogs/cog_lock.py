"""
cogs/cog_lock.py
─────────────────
Verrouillage de salons :
  /lock           → verrouille le salon actuel
  /lock #salon    → verrouille un salon spécifique
  /lockdown       → verrouille TOUS les salons textuels (urgence)
  /unlock         → déverrouille le salon actuel
  /unlock #salon  → déverrouille un salon spécifique
  /unlockdown     → déverrouille tout le serveur
"""

import discord
from discord.ext import commands
from discord import app_commands
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import load_config


class Lock(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot       = bot
        self.config    = load_config()
        self._locked: set[int] = set()  # IDs des salons verrouillés

    async def _log(self, guild, embed):
        ch = discord.utils.get(guild.text_channels, name=self.config["channels"]["logs_admin"])
        if ch:
            await ch.send(embed=embed)

    async def _lock_channel(self, channel: discord.TextChannel, raison: str, mod: discord.Member):
        """Verrouille un salon en retirant la permission d'envoyer des messages à @everyone."""
        overwrite = channel.overwrites_for(channel.guild.default_role)
        overwrite.send_messages = False
        await channel.set_permissions(channel.guild.default_role, overwrite=overwrite, reason=raison)
        self._locked.add(channel.id)

    async def _unlock_channel(self, channel: discord.TextChannel, raison: str, mod: discord.Member):
        """Déverrouille un salon en remettant la permission à None (héritage)."""
        overwrite = channel.overwrites_for(channel.guild.default_role)
        overwrite.send_messages = None
        await channel.set_permissions(channel.guild.default_role, overwrite=overwrite, reason=raison)
        self._locked.discard(channel.id)

    # ── /lock ──────────────────────────────────────────────────────────────────

    @app_commands.command(name="lock", description="[Mod] Verrouiller un salon")
    @app_commands.describe(salon="Salon à verrouiller (défaut : salon actuel)", raison="Raison")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def lock(
        self,
        interaction: discord.Interaction,
        salon: discord.TextChannel = None,
        raison: str = "Verrouillé par un modérateur"
    ):
        target = salon or interaction.channel
        await interaction.response.defer(ephemeral=True)

        try:
            await self._lock_channel(target, raison, interaction.user)
        except discord.Forbidden:
            await interaction.followup.send("❌ Permission insuffisante.", ephemeral=True)
            return

        await target.send(f"🔒 **Ce salon est verrouillé.** | {raison}")

        embed = discord.Embed(title="🔒 Salon verrouillé", color=discord.Color.red(), timestamp=datetime.now())
        embed.add_field(name="Salon",  value=target.mention, inline=True)
        embed.add_field(name="Raison", value=raison,         inline=True)
        embed.set_footer(text=f"Par {interaction.user}")
        await self._log(interaction.guild, embed)

        await interaction.followup.send(f"🔒 {target.mention} verrouillé.", ephemeral=True)

    # ── /unlock ────────────────────────────────────────────────────────────────

    @app_commands.command(name="unlock", description="[Mod] Déverrouiller un salon")
    @app_commands.describe(salon="Salon à déverrouiller (défaut : salon actuel)")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def unlock(self, interaction: discord.Interaction, salon: discord.TextChannel = None):
        target = salon or interaction.channel
        await interaction.response.defer(ephemeral=True)

        try:
            await self._unlock_channel(target, f"Déverrouillé par {interaction.user}", interaction.user)
        except discord.Forbidden:
            await interaction.followup.send("❌ Permission insuffisante.", ephemeral=True)
            return

        await target.send("🔓 **Ce salon est déverrouillé.**")

        embed = discord.Embed(title="🔓 Salon déverrouillé", color=discord.Color.green(), timestamp=datetime.now())
        embed.add_field(name="Salon", value=target.mention, inline=True)
        embed.set_footer(text=f"Par {interaction.user}")
        await self._log(interaction.guild, embed)

        await interaction.followup.send(f"🔓 {target.mention} déverrouillé.", ephemeral=True)

    # ── /lockdown ──────────────────────────────────────────────────────────────

    @app_commands.command(name="lockdown", description="[Admin] URGENCE — Verrouiller TOUS les salons")
    @app_commands.describe(raison="Raison du lockdown")
    @app_commands.checks.has_permissions(administrator=True)
    async def lockdown(self, interaction: discord.Interaction, raison: str = "Lockdown d'urgence"):
        await interaction.response.defer(ephemeral=True)

        locked = 0
        errors = 0
        for channel in interaction.guild.text_channels:
            try:
                await self._lock_channel(channel, raison, interaction.user)
                locked += 1
            except Exception:
                errors += 1

        embed = discord.Embed(
            title="🚨 LOCKDOWN ACTIVÉ",
            description=f"**{locked}** salons verrouillés | **{errors}** erreurs\n**Raison :** {raison}",
            color=discord.Color.dark_red(),
            timestamp=datetime.now()
        )
        embed.set_footer(text=f"Par {interaction.user}")
        await self._log(interaction.guild, embed)

        await interaction.followup.send(
            f"🚨 **Lockdown activé.** {locked} salons verrouillés.\nUtilise `/unlockdown` pour lever.", ephemeral=True
        )

    # ── /unlockdown ────────────────────────────────────────────────────────────

    @app_commands.command(name="unlockdown", description="[Admin] Lever le lockdown — déverrouiller tous les salons")
    @app_commands.checks.has_permissions(administrator=True)
    async def unlockdown(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        unlocked = 0
        for channel in interaction.guild.text_channels:
            try:
                await self._unlock_channel(channel, f"Unlockdown par {interaction.user}", interaction.user)
                unlocked += 1
            except Exception:
                pass

        embed = discord.Embed(
            title="🔓 Lockdown levé",
            description=f"**{unlocked}** salons déverrouillés",
            color=discord.Color.green(),
            timestamp=datetime.now()
        )
        embed.set_footer(text=f"Par {interaction.user}")
        await self._log(interaction.guild, embed)

        await interaction.followup.send(f"🔓 Lockdown levé. {unlocked} salons déverrouillés.", ephemeral=True)

    async def cog_app_command_error(self, interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Lock(bot))
