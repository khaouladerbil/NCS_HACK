"""
cogs/cog_automsg.py
────────────────────
Messages automatiques planifiés :
  /planifier-message #salon HH:MM MESSAGE  → programmer un message quotidien
  /liste-messages                          → voir tous les messages planifiés
  /supprimer-message ID                    → supprimer un message planifié
  /activer-message ID                      → activer/désactiver un message
"""

import discord
from discord.ext import commands
from discord import app_commands
from discord.ext import tasks
from datetime import datetime, time
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import load_json, save_json, load_config

MSGS_PATH = "data/scheduled_messages.json"


class AutoMsg(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()
        self.check_messages.start()

    def cog_unload(self):
        self.check_messages.cancel()

    def _next_id(self, msgs: list) -> int:
        return max((m["id"] for m in msgs), default=0) + 1

    # ── Tâche : vérifier toutes les minutes ────────────────────────────────────

    @tasks.loop(minutes=1)
    async def check_messages(self):
        msgs = load_json(MSGS_PATH, default=[])
        now  = datetime.now().strftime("%H:%M")
        changed = False

        for msg in msgs:
            if msg.get("active", True) and msg.get("time") == now:
                channel = self.bot.get_channel(int(msg["channel_id"]))
                if channel:
                    try:
                        await channel.send(msg["message"])
                        msg["last_sent"] = datetime.now().isoformat()
                        changed = True
                    except Exception as e:
                        print(f"[AutoMsg] Erreur envoi : {e}")

        if changed:
            save_json(MSGS_PATH, msgs)

    @check_messages.before_loop
    async def before_loop(self):
        await self.bot.wait_until_ready()

    # ── /planifier-message ─────────────────────────────────────────────────────

    @app_commands.command(name="planifier-message", description="[Admin] Programmer un message automatique quotidien")
    @app_commands.describe(
        salon="Le salon où envoyer",
        heure="Heure au format HH:MM (ex: 08:00)",
        message="Le message à envoyer chaque jour"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def planifier(
        self,
        interaction: discord.Interaction,
        salon: discord.TextChannel,
        heure: str,
        message: str
    ):
        import re
        if not re.fullmatch(r'\d{2}:\d{2}', heure):
            await interaction.response.send_message("❌ Format d'heure invalide. Utilise HH:MM (ex: `08:30`)", ephemeral=True)
            return

        msgs   = load_json(MSGS_PATH, default=[])
        new_id = self._next_id(msgs)

        msgs.append({
            "id":         new_id,
            "channel_id": str(salon.id),
            "channel":    f"#{salon.name}",
            "time":       heure,
            "message":    message,
            "active":     True,
            "created_by": str(interaction.user),
            "created_at": datetime.now().isoformat(),
            "last_sent":  None
        })
        save_json(MSGS_PATH, msgs)

        await interaction.response.send_message(
            f"✅ Message planifié (ID **{new_id}**) — envoyé dans {salon.mention} chaque jour à **{heure}**.",
            ephemeral=True
        )

    # ── /liste-messages ────────────────────────────────────────────────────────

    @app_commands.command(name="liste-messages", description="[Admin] Voir tous les messages planifiés")
    @app_commands.checks.has_permissions(administrator=True)
    async def liste_messages(self, interaction: discord.Interaction):
        msgs = load_json(MSGS_PATH, default=[])
        if not msgs:
            await interaction.response.send_message("ℹ️ Aucun message planifié.", ephemeral=True)
            return

        embed = discord.Embed(title=f"⏰ Messages planifiés ({len(msgs)})", color=discord.Color.blurple())
        for m in msgs[:10]:
            status = "✅ Actif" if m.get("active", True) else "⏸ Inactif"
            preview = m["message"][:60] + "..." if len(m["message"]) > 60 else m["message"]
            embed.add_field(
                name=f"ID {m['id']} — {m['time']} | {status}",
                value=f"**Salon :** {m['channel']}\n**Message :** {preview}",
                inline=False
            )

        await interaction.response.send_message(embed=embed, ephemeral=True)

    # ── /supprimer-message ─────────────────────────────────────────────────────

    @app_commands.command(name="supprimer-message", description="[Admin] Supprimer un message planifié")
    @app_commands.describe(id_message="L'ID du message (visible dans /liste-messages)")
    @app_commands.checks.has_permissions(administrator=True)
    async def supprimer_message(self, interaction: discord.Interaction, id_message: int):
        msgs     = load_json(MSGS_PATH, default=[])
        filtered = [m for m in msgs if m["id"] != id_message]

        if len(filtered) == len(msgs):
            await interaction.response.send_message(f"❌ Message ID `{id_message}` introuvable.", ephemeral=True)
            return

        save_json(MSGS_PATH, filtered)
        await interaction.response.send_message(f"✅ Message ID `{id_message}` supprimé.", ephemeral=True)

    # ── /activer-message ───────────────────────────────────────────────────────

    @app_commands.command(name="activer-message", description="[Admin] Activer ou désactiver un message planifié")
    @app_commands.describe(id_message="L'ID du message")
    @app_commands.checks.has_permissions(administrator=True)
    async def activer_message(self, interaction: discord.Interaction, id_message: int):
        msgs = load_json(MSGS_PATH, default=[])
        for m in msgs:
            if m["id"] == id_message:
                m["active"] = not m.get("active", True)
                save_json(MSGS_PATH, msgs)
                etat = "✅ activé" if m["active"] else "⏸ désactivé"
                await interaction.response.send_message(f"Message ID `{id_message}` {etat}.", ephemeral=True)
                return

        await interaction.response.send_message(f"❌ ID `{id_message}` introuvable.", ephemeral=True)

    async def cog_app_command_error(self, interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(AutoMsg(bot))
