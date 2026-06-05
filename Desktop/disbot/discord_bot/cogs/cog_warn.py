"""
cogs/cog_warn.py
─────────────────
Système d'avertissements :
  /warn @membre RAISON  → avertir
  /warns @membre        → consulter
  /clearwarns @membre   → effacer (admin)

  Sanctions automatiques (configurables dans config.json) :
    3 warns → mute 1h
    5 warns → ban 24h
"""

import discord
from discord.ext import commands
from discord import app_commands
from datetime import datetime, timezone, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import load_json, save_json, load_config, format_duration

WARNS_PATH = "data/warns.json"


class Warn(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()

    async def _log(self, guild: discord.Guild, embed: discord.Embed):
        ch = discord.utils.get(guild.text_channels, name=self.config["channels"]["logs_admin"])
        if ch:
            await ch.send(embed=embed)

    # ── /warn ──────────────────────────────────────────────────────────────────

    @app_commands.command(name="warn", description="[Mod] Avertir un membre")
    @app_commands.describe(membre="Le membre à avertir", raison="La raison")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def warn(self, interaction: discord.Interaction, membre: discord.Member, raison: str):
        await interaction.response.defer(ephemeral=True)

        if membre.bot:
            await interaction.followup.send("❌ Impossible d'avertir un bot.", ephemeral=True)
            return
        if membre.top_role >= interaction.user.top_role:
            await interaction.followup.send("❌ Rôle insuffisant pour avertir ce membre.", ephemeral=True)
            return

        warns = load_json(WARNS_PATH)
        uid   = str(membre.id)
        if uid not in warns:
            warns[uid] = {"count": 0, "history": []}

        warns[uid]["count"] += 1
        warns[uid]["history"].append({
            "raison":        raison,
            "timestamp":     datetime.now().isoformat(),
            "moderateur":    str(interaction.user),
            "moderateur_id": str(interaction.user.id)
        })
        save_json(WARNS_PATH, warns)
        count = warns[uid]["count"]

        cfg_w = self.config.get("warns", {})
        mute_threshold = cfg_w.get("mute_threshold", 3)
        ban_threshold  = cfg_w.get("ban_threshold",  5)
        mute_dur       = cfg_w.get("mute_duration_seconds", 3600)
        ban_dur        = cfg_w.get("ban_duration_seconds",  86400)

        # DM à la personne
        try:
            hint = ""
            if count == mute_threshold - 1:
                hint = f"\n⚠️ Prochain warn = mute {format_duration(mute_dur)} automatique !"
            await membre.send(
                f"⚠️ **Avertissement sur {interaction.guild.name}**\n\n"
                f"**Raison :** {raison}\n"
                f"**Modérateur :** {interaction.user}\n"
                f"**Total warns :** {count}{hint}"
            )
        except discord.Forbidden:
            pass

        # Sanction automatique
        sanction_msg = ""
        try:
            if count >= ban_threshold:
                until = datetime.now(timezone.utc) + timedelta(seconds=ban_dur)
                await membre.timeout(until, reason=f"[Auto] {ban_threshold} warns — {raison}")
                sanction_msg = f"\n🔨 **Sanction auto : Ban {format_duration(ban_dur)}** ({ban_threshold} warns)"
            elif count >= mute_threshold:
                until = datetime.now(timezone.utc) + timedelta(seconds=mute_dur)
                await membre.timeout(until, reason=f"[Auto] {mute_threshold} warns — {raison}")
                sanction_msg = f"\n🔇 **Sanction auto : Mute {format_duration(mute_dur)}** ({mute_threshold} warns)"
        except discord.Forbidden:
            sanction_msg = "\n⚠️ Impossible d'appliquer la sanction automatique (permissions)."

        # Log admin
        embed = discord.Embed(title="⚠️ Avertissement", color=discord.Color.orange(), timestamp=datetime.now())
        embed.set_thumbnail(url=membre.display_avatar.url)
        embed.add_field(name="Membre",      value=f"{membre.mention} `{membre}`", inline=True)
        embed.add_field(name="Warns total", value=f"**{count}**",                 inline=True)
        embed.add_field(name="Raison",      value=raison,                         inline=False)
        if sanction_msg:
            embed.add_field(name="Sanction auto", value=sanction_msg.strip(), inline=False)
        embed.set_footer(text=f"Par {interaction.user}")
        await self._log(interaction.guild, embed)

        await interaction.followup.send(
            f"✅ {membre.mention} averti (**{count}** warn{'s' if count > 1 else ''} total).{sanction_msg}",
            ephemeral=True
        )

    # ── /warns ─────────────────────────────────────────────────────────────────

    @app_commands.command(name="warns", description="Voir les avertissements d'un membre")
    @app_commands.describe(membre="Le membre à vérifier")
    @app_commands.checks.has_permissions(manage_messages=True)
    async def warns_cmd(self, interaction: discord.Interaction, membre: discord.Member):
        data = load_json(WARNS_PATH)
        uid  = str(membre.id)

        if uid not in data or data[uid]["count"] == 0:
            await interaction.response.send_message(f"✅ {membre.mention} n'a aucun avertissement.", ephemeral=True)
            return

        info  = data[uid]
        embed = discord.Embed(title=f"⚠️ Warns de {membre.display_name}", color=discord.Color.orange())
        embed.set_thumbnail(url=membre.display_avatar.url)
        embed.add_field(name="Total", value=f"**{info['count']}** warn(s)", inline=False)

        for i, w in enumerate(info["history"][-5:], 1):
            embed.add_field(
                name=f"Warn #{i}",
                value=f"**Raison :** {w['raison']}\n**Par :** {w.get('moderateur','?')}\n**Date :** {w['timestamp'][:10]}",
                inline=True
            )

        await interaction.response.send_message(embed=embed, ephemeral=True)

    # ── /clearwarns ────────────────────────────────────────────────────────────

    @app_commands.command(name="clearwarns", description="[Admin] Effacer tous les warns d'un membre")
    @app_commands.describe(membre="Le membre")
    @app_commands.checks.has_permissions(administrator=True)
    async def clearwarns(self, interaction: discord.Interaction, membre: discord.Member):
        data      = load_json(WARNS_PATH)
        uid       = str(membre.id)
        old_count = data.get(uid, {}).get("count", 0)
        data[uid] = {"count": 0, "history": []}
        save_json(WARNS_PATH, data)
        await interaction.response.send_message(
            f"✅ {old_count} warn(s) de {membre.mention} effacés.", ephemeral=True
        )

    async def cog_app_command_error(self, interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Warn(bot))
