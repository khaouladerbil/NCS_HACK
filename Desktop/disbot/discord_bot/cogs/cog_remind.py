"""
cogs/cog_remind.py
───────────────────
Rappels personnels et de rôle :
  /remind moi 30m Réunion admin         → DM personnel après 30 minutes
  /remind @role 1h Message              → DM à tous les membres du rôle
  /mes-rappels                          → voir ses rappels en cours
  /annuler-rappel ID                    → annuler un rappel
"""

import discord
from discord.ext import commands
from discord import app_commands
from discord.ext import tasks
from datetime import datetime, timezone, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import parse_duration, format_duration, load_json, save_json

REMINDERS_PATH = "data/reminders.json"


class Remind(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.check_reminders.start()

    def cog_unload(self):
        self.check_reminders.cancel()

    def _next_id(self) -> int:
        reminders = load_json(REMINDERS_PATH, default=[])
        return max((r["id"] for r in reminders), default=0) + 1

    # ── Tâche : vérifier les rappels toutes les 30 secondes ────────────────────

    @tasks.loop(seconds=30)
    async def check_reminders(self):
        reminders = load_json(REMINDERS_PATH, default=[])
        now       = datetime.now(timezone.utc)
        remaining = []
        changed   = False

        for r in reminders:
            trigger = datetime.fromisoformat(r["trigger_at"])
            if now >= trigger:
                await self._send_reminder(r)
                changed = True
            else:
                remaining.append(r)

        if changed:
            save_json(REMINDERS_PATH, remaining)

    @check_reminders.before_loop
    async def before_check(self):
        await self.bot.wait_until_ready()

    async def _send_reminder(self, r: dict):
        """Envoie le rappel à l'utilisateur ou aux membres du rôle."""
        trigger = datetime.fromisoformat(r["trigger_at"])
        msg     = (
            f"⏰ **Rappel !**\n\n"
            f"**Message :** {r['message']}\n"
            f"_Programmé le {trigger.strftime('%d/%m/%Y à %H:%M')}_"
        )

        if r.get("role_id"):
            # Rappel de rôle : chercher le guild et le rôle
            guild = self.bot.get_guild(int(r["guild_id"]))
            if not guild:
                return
            role = guild.get_role(int(r["role_id"]))
            if not role:
                return
            sent = 0
            for member in role.members:
                if not member.bot:
                    try:
                        await member.send(msg)
                        sent += 1
                    except discord.Forbidden:
                        pass

            # Confirmer dans le salon d'origine si possible
            if r.get("channel_id"):
                ch = guild.get_channel(int(r["channel_id"]))
                if ch:
                    try:
                        await ch.send(f"⏰ Rappel envoyé à **{sent}** membres du rôle {role.mention}.")
                    except Exception:
                        pass
        else:
            # Rappel personnel
            user = self.bot.get_user(int(r["user_id"]))
            if user:
                try:
                    await user.send(msg)
                except discord.Forbidden:
                    pass

    # ── /remind ────────────────────────────────────────────────────────────────

    @app_commands.command(name="remind", description="Créer un rappel personnel ou pour un rôle")
    @app_commands.describe(
        cible="'moi' ou mentionner un rôle @role",
        duree="Délai : 10m, 2h, 1d",
        message="Le message du rappel"
    )
    async def remind(self, interaction: discord.Interaction, cible: str, duree: str, message: str):
        await interaction.response.defer(ephemeral=True)

        seconds = parse_duration(duree)
        if not seconds:
            await interaction.followup.send("❌ Format invalide. Ex: `10m`, `2h`, `1d`", ephemeral=True)
            return
        if seconds > 30 * 86400:
            await interaction.followup.send("❌ Maximum 30 jours.", ephemeral=True)
            return

        trigger_at = datetime.now(timezone.utc) + timedelta(seconds=seconds)
        dur_txt    = format_duration(seconds)

        reminders  = load_json(REMINDERS_PATH, default=[])
        new_id     = self._next_id()

        # Vérifier si c'est "moi" ou un rôle
        role_id = None
        if cible.lower() not in ["moi", "me", "myself"]:
            # Essayer d'extraire un ID de rôle depuis la mention <@&ID>
            import re
            match = re.search(r'<@&(\d+)>', cible)
            if match:
                role_id = match.group(1)
                role    = interaction.guild.get_role(int(role_id)) if interaction.guild else None
                if not role:
                    await interaction.followup.send("❌ Rôle introuvable.", ephemeral=True)
                    return
                # Vérifier la permission pour rappel de rôle
                if not interaction.user.guild_permissions.manage_roles:
                    await interaction.followup.send("❌ Tu as besoin de la permission `Gérer les rôles` pour rappeler un rôle.", ephemeral=True)
                    return
            else:
                await interaction.followup.send(
                    "❌ Utilise `moi` pour un rappel personnel ou mentionne un rôle `@NomDuRole`.", ephemeral=True
                )
                return

        entry = {
            "id":         new_id,
            "user_id":    str(interaction.user.id),
            "guild_id":   str(interaction.guild.id) if interaction.guild else "",
            "channel_id": str(interaction.channel.id),
            "role_id":    role_id,
            "message":    message,
            "trigger_at": trigger_at.isoformat(),
            "created_at": datetime.now().isoformat()
        }
        reminders.append(entry)
        save_json(REMINDERS_PATH, reminders)

        if role_id:
            role = interaction.guild.get_role(int(role_id))
            await interaction.followup.send(
                f"✅ Rappel planifié pour {role.mention} dans **{dur_txt}** (ID `{new_id}`).\n"
                f"📝 Message : _{message}_",
                ephemeral=True
            )
        else:
            await interaction.followup.send(
                f"✅ Rappel personnel dans **{dur_txt}** (ID `{new_id}`).\n"
                f"📝 Message : _{message}_\n"
                f"⏰ À : <t:{int(trigger_at.timestamp())}:F>",
                ephemeral=True
            )

    # ── /mes-rappels ───────────────────────────────────────────────────────────

    @app_commands.command(name="mes-rappels", description="Voir tes rappels en cours")
    async def mes_rappels(self, interaction: discord.Interaction):
        reminders = load_json(REMINDERS_PATH, default=[])
        mes       = [r for r in reminders if r["user_id"] == str(interaction.user.id)]

        if not mes:
            await interaction.response.send_message("ℹ️ Aucun rappel en cours.", ephemeral=True)
            return

        embed = discord.Embed(title=f"⏰ Tes rappels ({len(mes)})", color=discord.Color.blurple())
        for r in mes[:10]:
            trigger = datetime.fromisoformat(r["trigger_at"])
            cible   = f"Rôle `{r['role_id']}`" if r.get("role_id") else "Personnel (DM)"
            embed.add_field(
                name=f"ID {r['id']} — <t:{int(trigger.timestamp())}:R>",
                value=f"**Message :** {r['message']}\n**Pour :** {cible}",
                inline=False
            )

        await interaction.response.send_message(embed=embed, ephemeral=True)

    # ── /annuler-rappel ────────────────────────────────────────────────────────

    @app_commands.command(name="annuler-rappel", description="Annuler un rappel")
    @app_commands.describe(id_rappel="L'ID du rappel (visible dans /mes-rappels)")
    async def annuler_rappel(self, interaction: discord.Interaction, id_rappel: int):
        reminders = load_json(REMINDERS_PATH, default=[])
        filtered  = [
            r for r in reminders
            if not (r["id"] == id_rappel and r["user_id"] == str(interaction.user.id))
        ]

        if len(filtered) == len(reminders):
            await interaction.response.send_message(
                f"❌ Rappel ID `{id_rappel}` introuvable ou ne t'appartient pas.", ephemeral=True
            )
            return

        save_json(REMINDERS_PATH, filtered)
        await interaction.response.send_message(f"✅ Rappel ID `{id_rappel}` annulé.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Remind(bot))
