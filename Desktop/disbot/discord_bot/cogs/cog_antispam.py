"""
cogs/cog_antispam.py
─────────────────────
Détection automatique du spam :
  - Trop de messages en peu de temps  → mute auto
  - Même message répété               → mute auto
  - Trop de mentions dans un message  → mute auto
  Seuils configurables dans config.json → antispam
"""

import discord
from discord.ext import commands
from collections import defaultdict
from datetime import datetime, timezone, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import load_config, format_duration


class AntiSpam(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()
        # Historique : {user_id: [timestamps]}
        self._msg_history: dict[int, list] = defaultdict(list)
        # Historique des contenus : {user_id: [contents]}
        self._content_history: dict[int, list] = defaultdict(list)
        # Membres récemment mutés pour spam (éviter double-mute)
        self._muted: set[int] = set()

    def _get_cfg(self):
        return self.config.get("antispam", {
            "max_messages":        5,
            "time_window_seconds": 5,
            "max_mentions":        5,
            "max_repeated":        3,
            "mute_duration_seconds": 300
        })

    async def _mute_spam(self, member: discord.Member, raison: str, guild: discord.Guild):
        if member.id in self._muted:
            return
        self._muted.add(member.id)

        cfg      = self._get_cfg()
        dur      = cfg.get("mute_duration_seconds", 300)
        until    = datetime.now(timezone.utc) + timedelta(seconds=dur)
        dur_text = format_duration(dur)

        try:
            await member.timeout(until, reason=f"[AntiSpam] {raison}")
        except discord.Forbidden:
            self._muted.discard(member.id)
            return

        # DM à la personne
        try:
            await member.send(
                f"🤖 **Tu as été automatiquement muté** sur **{guild.name}**\n\n"
                f"**Raison :** {raison}\n"
                f"**Durée :** {dur_text}\n\n"
                f"Évite d'envoyer autant de messages en si peu de temps."
            )
        except discord.Forbidden:
            pass

        # Alerte dans le salon admin
        ch = discord.utils.get(guild.text_channels, name=self.config["channels"]["logs_admin"])
        if ch:
            embed = discord.Embed(
                title="🤖 Anti-spam déclenché",
                color=discord.Color.orange(),
                timestamp=datetime.now()
            )
            embed.set_thumbnail(url=member.display_avatar.url)
            embed.add_field(name="Membre",  value=f"{member.mention} `{member}`", inline=True)
            embed.add_field(name="Durée",   value=dur_text,                       inline=True)
            embed.add_field(name="Raison",  value=raison,                         inline=False)
            await ch.send(embed=embed)

        # Retirer de _muted après la durée
        async def _remove_after():
            await __import__('asyncio').sleep(dur)
            self._muted.discard(member.id)

        self.bot.loop.create_task(_remove_after())

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        if message.author.guild_permissions.manage_messages:
            return

        member = message.author
        now    = datetime.now(timezone.utc)
        cfg    = self._get_cfg()

        max_msgs   = cfg.get("max_messages", 5)
        window     = cfg.get("time_window_seconds", 5)
        max_ment   = cfg.get("max_mentions", 5)
        max_repeat = cfg.get("max_repeated", 3)

        # 1. Flood : trop de messages dans la fenêtre de temps
        history = self._msg_history[member.id]
        history.append(now)
        cutoff  = now - timedelta(seconds=window)
        self._msg_history[member.id] = [t for t in history if t > cutoff]

        if len(self._msg_history[member.id]) >= max_msgs:
            self._msg_history[member.id].clear()
            await self._mute_spam(
                member,
                f"Flood détecté : {max_msgs} messages en {window}s",
                message.guild
            )
            return

        # 2. Répétition : même message plusieurs fois
        contents = self._content_history[member.id]
        contents.append(message.content.strip().lower())
        if len(contents) > max_repeat * 2:
            contents.pop(0)
        self._content_history[member.id] = contents

        if len(contents) >= max_repeat and len(set(contents[-max_repeat:])) == 1:
            self._content_history[member.id].clear()
            await self._mute_spam(
                member,
                f"Spam détecté : même message répété {max_repeat} fois",
                message.guild
            )
            return

        # 3. Mass-mentions
        total_mentions = len(message.mentions) + len(message.role_mentions)
        if total_mentions >= max_ment:
            await self._mute_spam(
                member,
                f"Mass-mention : {total_mentions} mentions dans un message",
                message.guild
            )
            try:
                await message.delete()
            except discord.Forbidden:
                pass


async def setup(bot: commands.Bot):
    await bot.add_cog(AntiSpam(bot))
