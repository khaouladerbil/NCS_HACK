"""
cogs/cog_tempban.py
────────────────────
Ban temporaire avec déban automatique :
  /tempban @membre DURÉE RAISON  → bannir temporairement
  /unban ID_OU_TAG RAISON        → dé-bannir manuellement
  /bans-actifs                   → voir les bans en cours (admin)

  Tâche en arrière-plan : vérifie toutes les minutes les bans expirés.
"""

import discord
from discord.ext import commands
from discord import app_commands
from discord.ext import tasks
from datetime import datetime, timezone, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import parse_duration, format_duration, load_json, save_json, load_config

BANS_PATH = "data/tempbans.json"


class TempBan(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()
        self.check_bans.start()

    def cog_unload(self):
        self.check_bans.cancel()

    async def _log(self, guild, embed):
        ch = discord.utils.get(guild.text_channels, name=self.config["channels"]["logs_admin"])
        if ch:
            await ch.send(embed=embed)

    # ── Tâche : vérifier les bans expirés chaque minute ────────────────────────

    @tasks.loop(minutes=1)
    async def check_bans(self):
        bans = load_json(BANS_PATH)
        now  = datetime.now(timezone.utc)
        changed = False

        for user_id, info in list(bans.items()):
            unban_at = datetime.fromisoformat(info["unban_at"])
            if now >= unban_at:
                guild = self.bot.get_guild(int(info["guild_id"]))
                if guild:
                    try:
                        user = discord.Object(id=int(user_id))
                        await guild.unban(user, reason="[Auto] Fin du ban temporaire")
                        print(f"[TempBan] ✅ Déban auto : {user_id}")

                        embed = discord.Embed(
                            title="✅ Ban temporaire expiré",
                            color=discord.Color.green(),
                            timestamp=datetime.now()
                        )
                        embed.add_field(name="Utilisateur", value=f"ID `{user_id}`",        inline=True)
                        embed.add_field(name="Raison initiale", value=info.get("raison","?"), inline=False)
                        await self._log(guild, embed)
                    except Exception as e:
                        print(f"[TempBan] Erreur déban {user_id}: {e}")

                del bans[user_id]
                changed = True

        if changed:
            save_json(BANS_PATH, bans)

    @check_bans.before_loop
    async def before_check(self):
        await self.bot.wait_until_ready()

    # ── /tempban ───────────────────────────────────────────────────────────────

    @app_commands.command(name="tempban", description="[Mod] Bannir temporairement un membre")
    @app_commands.describe(
        membre="Le membre à bannir",
        duree="Durée : 1h, 1d, 7d, 30d",
        raison="La raison du ban"
    )
    @app_commands.checks.has_permissions(ban_members=True)
    async def tempban(self, interaction: discord.Interaction, membre: discord.Member, duree: str, raison: str = "Aucune raison"):
        await interaction.response.defer(ephemeral=True)

        if membre.top_role >= interaction.user.top_role:
            await interaction.followup.send("❌ Rôle insuffisant.", ephemeral=True)
            return

        seconds = parse_duration(duree)
        if not seconds:
            await interaction.followup.send("❌ Format invalide. Ex: `1h`, `7d`, `30d`", ephemeral=True)
            return

        unban_at = datetime.now(timezone.utc) + timedelta(seconds=seconds)
        duree_txt = format_duration(seconds)

        # DM avant le ban
        try:
            await membre.send(
                f"🔨 **Tu as été banni temporairement de {interaction.guild.name}**\n\n"
                f"**Durée :** {duree_txt}\n"
                f"**Raison :** {raison}\n"
                f"**Fin du ban :** <t:{int(unban_at.timestamp())}:F>"
            )
        except discord.Forbidden:
            pass

        try:
            await interaction.guild.ban(membre, reason=f"[TempBan {duree_txt}] {raison} | Par {interaction.user}", delete_message_days=0)
        except discord.Forbidden:
            await interaction.followup.send("❌ Permission insuffisante pour bannir.", ephemeral=True)
            return

        bans = load_json(BANS_PATH)
        bans[str(membre.id)] = {
            "guild_id":  str(interaction.guild.id),
            "unban_at":  unban_at.isoformat(),
            "raison":    raison,
            "moderateur": str(interaction.user),
            "ban_at":    datetime.now().isoformat()
        }
        save_json(BANS_PATH, bans)

        embed = discord.Embed(title="🔨 Ban temporaire", color=discord.Color.dark_red(), timestamp=datetime.now())
        embed.set_thumbnail(url=membre.display_avatar.url)
        embed.add_field(name="Membre",  value=f"{membre.mention} `{membre}`",          inline=True)
        embed.add_field(name="Durée",   value=duree_txt,                               inline=True)
        embed.add_field(name="Fin",     value=f"<t:{int(unban_at.timestamp())}:R>",    inline=True)
        embed.add_field(name="Raison",  value=raison,                                  inline=False)
        embed.set_footer(text=f"Par {interaction.user}")
        await self._log(interaction.guild, embed)

        await interaction.followup.send(
            f"🔨 {membre} banni pour **{duree_txt}**. Déban automatique <t:{int(unban_at.timestamp())}:R>.", ephemeral=True
        )

    # ── /unban ─────────────────────────────────────────────────────────────────

    @app_commands.command(name="unban", description="[Mod] Débannir manuellement un utilisateur")
    @app_commands.describe(user_id="ID Discord de l'utilisateur", raison="Raison du déban")
    @app_commands.checks.has_permissions(ban_members=True)
    async def unban(self, interaction: discord.Interaction, user_id: str, raison: str = "Déban manuel"):
        await interaction.response.defer(ephemeral=True)
        try:
            user = discord.Object(id=int(user_id))
            await interaction.guild.unban(user, reason=f"{raison} | Par {interaction.user}")

            bans = load_json(BANS_PATH)
            if user_id in bans:
                del bans[user_id]
                save_json(BANS_PATH, bans)

            embed = discord.Embed(title="✅ Déban manuel", color=discord.Color.green(), timestamp=datetime.now())
            embed.add_field(name="User ID", value=f"`{user_id}`", inline=True)
            embed.add_field(name="Raison",  value=raison,         inline=True)
            embed.set_footer(text=f"Par {interaction.user}")
            await self._log(interaction.guild, embed)

            await interaction.followup.send(f"✅ Utilisateur `{user_id}` débanni.", ephemeral=True)
        except (ValueError, discord.NotFound):
            await interaction.followup.send("❌ Utilisateur introuvable ou non banni.", ephemeral=True)
        except discord.Forbidden:
            await interaction.followup.send("❌ Permission insuffisante.", ephemeral=True)

    # ── /bans-actifs ───────────────────────────────────────────────────────────

    @app_commands.command(name="bans-actifs", description="[Admin] Liste des bans temporaires en cours")
    @app_commands.checks.has_permissions(ban_members=True)
    async def bans_actifs(self, interaction: discord.Interaction):
        bans = load_json(BANS_PATH)
        guild_bans = {uid: info for uid, info in bans.items() if info["guild_id"] == str(interaction.guild.id)}

        if not guild_bans:
            await interaction.response.send_message("✅ Aucun ban temporaire en cours.", ephemeral=True)
            return

        embed = discord.Embed(title=f"🔨 Bans temporaires actifs ({len(guild_bans)})", color=discord.Color.dark_red())
        for uid, info in list(guild_bans.items())[:10]:
            unban_at = datetime.fromisoformat(info["unban_at"])
            embed.add_field(
                name=f"ID : {uid}",
                value=f"**Raison :** {info.get('raison','?')}\n**Fin :** <t:{int(unban_at.timestamp())}:R>",
                inline=True
            )

        await interaction.response.send_message(embed=embed, ephemeral=True)

    async def cog_app_command_error(self, interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(TempBan(bot))
