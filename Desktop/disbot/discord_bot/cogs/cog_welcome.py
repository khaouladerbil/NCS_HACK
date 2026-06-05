"""
cogs/cog_welcome.py
────────────────────
Message de bienvenue automatique :
  - Envoi d'un DM à chaque nouveau membre qui rejoint le serveur
  - Explique comment effectuer la vérification du matricule
"""

import discord
from discord.ext import commands
import json


class Welcome(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = self._load_config()

    def _load_config(self) -> dict:
        with open("config.json", "r", encoding="utf-8") as f:
            return json.load(f)

    # ── Listener : nouveau membre ──────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        channel_verif = self.config["channels"]["verification"]
        msg           = self.config.get("welcome_message", "")

        # Personnaliser le message avec le nom du salon
        msg_final = msg.replace("{channel}", channel_verif)
        msg_final = msg_final.replace("{member}", member.display_name)

        try:
            await member.send(msg_final)
            print(f"[Welcome] DM envoyé à {member}")
        except discord.Forbidden:
            # DMs désactivés : envoyer dans le salon de vérification à la place
            verif_chan = discord.utils.get(
                member.guild.text_channels,
                name=channel_verif
            )
            if verif_chan:
                await verif_chan.send(
                    f"👋 Bienvenue {member.mention} ! "
                    f"Écris ton matricule ici pour obtenir tes rôles.",
                    delete_after=30
                )


async def setup(bot: commands.Bot):
    await bot.add_cog(Welcome(bot))
