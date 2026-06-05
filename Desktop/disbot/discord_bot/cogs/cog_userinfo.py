"""
cogs/cog_userinfo.py
─────────────────────
Fiche complète d'un membre :
  /userinfo @membre  → embed avec tout : compte, rôles, warns, vérification, sanctions
  /serverinfo        → statistiques générales du serveur
"""

import discord
from discord.ext import commands
from discord import app_commands
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import load_json, load_config

WARNS_PATH    = "data/warns.json"
USED_MAT_PATH = "data/used_matricules.json"
BANS_PATH     = "data/tempbans.json"


class UserInfo(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()

    # ── /userinfo ──────────────────────────────────────────────────────────────

    @app_commands.command(name="userinfo", description="Afficher la fiche complète d'un membre")
    @app_commands.describe(membre="Le membre à inspecter (défaut : vous-même)")
    async def userinfo(self, interaction: discord.Interaction, membre: discord.Member = None):
        await interaction.response.defer(ephemeral=True)
        target = membre or interaction.user

        now      = datetime.now(timezone.utc)
        created  = target.created_at
        joined   = target.joined_at or now
        age_acct = (now - created).days
        age_serv = (now - joined).days

        # Données warns
        warns_data = load_json(WARNS_PATH)
        warn_count = warns_data.get(str(target.id), {}).get("count", 0)

        # Vérification matricule
        used = load_json(USED_MAT_PATH)
        matricule = next((m for m, info in used.items() if info.get("user_id") == str(target.id)), None)

        # Tempban actif ?
        bans      = load_json(BANS_PATH)
        ban_info  = bans.get(str(target.id))
        ban_text  = ""
        if ban_info:
            unban_at = datetime.fromisoformat(ban_info["unban_at"])
            ban_text = f"🔨 Banni jusqu'au <t:{int(unban_at.timestamp())}:F>"

        # Rôles (sans @everyone)
        roles = [r.mention for r in reversed(target.roles) if r.name != "@everyone"]

        # Badges
        badges = []
        if target.bot:                          badges.append("🤖 Bot")
        if target.premium_since:                badges.append("💎 Booster")
        if target.is_timed_out():               badges.append("🔇 Muté")
        if warn_count >= 3:                     badges.append("⚠️ Avertissements")
        if matricule:                           badges.append("✅ Vérifié")

        # Construction de l'embed
        embed = discord.Embed(
            color=target.color if target.color != discord.Color.default() else discord.Color.blurple(),
            timestamp=datetime.now()
        )
        embed.set_author(name=str(target), icon_url=target.display_avatar.url)
        embed.set_thumbnail(url=target.display_avatar.url)

        # Infos compte
        embed.add_field(
            name="📅 Compte Discord",
            value=f"Créé <t:{int(created.timestamp())}:R>\n({age_acct} jours)",
            inline=True
        )
        embed.add_field(
            name="📅 Sur le serveur",
            value=f"Depuis <t:{int(joined.timestamp())}:R>\n({age_serv} jours)",
            inline=True
        )
        embed.add_field(name="🆔 ID", value=f"`{target.id}`", inline=True)

        # Statut & activité
        status_map = {
            discord.Status.online:    "🟢 En ligne",
            discord.Status.idle:      "🌙 Absent",
            discord.Status.dnd:       "🔴 Ne pas déranger",
            discord.Status.offline:   "⚫ Hors ligne",
        }
        embed.add_field(name="Statut", value=status_map.get(target.status, "?"), inline=True)

        # Modération
        embed.add_field(name="⚠️ Avertissements", value=f"**{warn_count}** warn(s)", inline=True)
        embed.add_field(name="✅ Vérifié",         value=f"`{matricule}`" if matricule else "Non vérifié", inline=True)

        if ban_text:
            embed.add_field(name="Sanction active", value=ban_text, inline=False)

        if target.is_timed_out() and target.timed_out_until:
            embed.add_field(
                name="🔇 Mute jusqu'au",
                value=f"<t:{int(target.timed_out_until.timestamp())}:F>",
                inline=False
            )

        # Rôles
        if roles:
            embed.add_field(
                name=f"🎭 Rôles ({len(roles)})",
                value=" ".join(roles[:15]) + (" ..." if len(roles) > 15 else ""),
                inline=False
            )

        # Badges
        if badges:
            embed.add_field(name="🏅 Badges", value=" · ".join(badges), inline=False)

        embed.set_footer(text=f"Demandé par {interaction.user}")
        await interaction.followup.send(embed=embed, ephemeral=True)

    # ── /serverinfo ────────────────────────────────────────────────────────────

    @app_commands.command(name="serverinfo", description="Informations générales sur le serveur")
    async def serverinfo(self, interaction: discord.Interaction):
        guild   = interaction.guild
        used    = load_json(USED_MAT_PATH)
        bots    = sum(1 for m in guild.members if m.bot)
        humains = guild.member_count - bots
        verifies = len(used)

        embed = discord.Embed(title=f"📊 {guild.name}", color=discord.Color.blurple(), timestamp=datetime.now())
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)

        embed.add_field(name="👥 Membres",     value=f"**{guild.member_count}** total\n{humains} humains · {bots} bots", inline=True)
        embed.add_field(name="✅ Vérifiés",    value=f"**{verifies}** / {humains}",  inline=True)
        embed.add_field(name="📅 Créé le",     value=f"<t:{int(guild.created_at.timestamp())}:D>", inline=True)
        embed.add_field(name="💬 Salons",      value=f"{len(guild.text_channels)} texte · {len(guild.voice_channels)} vocal", inline=True)
        embed.add_field(name="🎭 Rôles",       value=str(len(guild.roles) - 1), inline=True)
        embed.add_field(name="💎 Boosts",      value=str(guild.premium_subscription_count), inline=True)
        embed.set_footer(text=f"ID : {guild.id}")

        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(UserInfo(bot))
