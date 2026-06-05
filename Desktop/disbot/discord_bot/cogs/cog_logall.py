"""
cogs/cog_logall.py
───────────────────
Journal complet du serveur (dans #logs-admin) :
  - Messages supprimés / modifiés
  - Membres qui rejoignent / quittent
  - Bans / unbans
  - Changements de rôles
  - Création / suppression de salons
"""

import discord
from discord.ext import commands
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import load_config


class LogAll(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()

    async def _log(self, guild: discord.Guild, embed: discord.Embed):
        ch = discord.utils.get(guild.text_channels, name=self.config["channels"]["logs_admin"])
        if ch:
            await ch.send(embed=embed)

    # ── Messages supprimés ─────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_message_delete(self, message: discord.Message):
        if message.author.bot or not message.guild:
            return
        if not message.content and not message.attachments:
            return

        embed = discord.Embed(title="🗑️ Message supprimé", color=discord.Color.red(), timestamp=datetime.now())
        embed.set_author(name=str(message.author), icon_url=message.author.display_avatar.url)
        embed.add_field(name="Salon",   value=message.channel.mention, inline=True)
        embed.add_field(name="Auteur",  value=message.author.mention,  inline=True)
        if message.content:
            contenu = message.content[:1000] + ("..." if len(message.content) > 1000 else "")
            embed.add_field(name="Contenu", value=f"```{contenu}```", inline=False)
        if message.attachments:
            embed.add_field(name="Pièces jointes", value="\n".join(a.filename for a in message.attachments), inline=False)

        await self._log(message.guild, embed)

    # ── Messages modifiés ──────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_message_edit(self, before: discord.Message, after: discord.Message):
        if before.author.bot or not before.guild:
            return
        if before.content == after.content:
            return

        embed = discord.Embed(title="✏️ Message modifié", color=discord.Color.orange(), timestamp=datetime.now())
        embed.set_author(name=str(before.author), icon_url=before.author.display_avatar.url)
        embed.add_field(name="Salon",  value=before.channel.mention, inline=True)
        embed.add_field(name="Auteur", value=before.author.mention,  inline=True)
        embed.add_field(name="Lien",   value=f"[Voir le message]({after.jump_url})", inline=True)

        avant = before.content[:500] + ("..." if len(before.content) > 500 else "")
        apres = after.content[:500]  + ("..." if len(after.content)  > 500 else "")
        embed.add_field(name="Avant", value=f"```{avant}```", inline=False)
        embed.add_field(name="Après", value=f"```{apres}```", inline=False)

        await self._log(before.guild, embed)

    # ── Nouveau membre ─────────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        created = member.created_at
        age_days = (datetime.utcnow() - created.replace(tzinfo=None)).days

        embed = discord.Embed(title="✅ Nouveau membre", color=discord.Color.green(), timestamp=datetime.now())
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="Membre",              value=f"{member.mention} `{member}`",          inline=True)
        embed.add_field(name="ID",                  value=f"`{member.id}`",                        inline=True)
        embed.add_field(name="Compte créé",         value=f"<t:{int(created.timestamp())}:R>",     inline=True)
        embed.add_field(name="Âge du compte",       value=f"**{age_days}** jours",                 inline=True)
        embed.add_field(name="Membres total",       value=str(member.guild.member_count),          inline=True)
        if age_days < 7:
            embed.add_field(name="⚠️ Alerte", value="Compte récent (moins de 7 jours)", inline=False)
            embed.color = discord.Color.orange()

        await self._log(member.guild, embed)

    # ── Membre qui part ────────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        roles = [r.mention for r in member.roles if r.name != "@everyone"]
        embed = discord.Embed(title="🚪 Membre parti", color=discord.Color.light_grey(), timestamp=datetime.now())
        embed.set_thumbnail(url=member.display_avatar.url)
        embed.add_field(name="Membre",  value=f"`{member}`",    inline=True)
        embed.add_field(name="ID",      value=f"`{member.id}`", inline=True)
        if member.joined_at:
            embed.add_field(name="Arrivé",  value=f"<t:{int(member.joined_at.timestamp())}:R>", inline=True)
        if roles:
            embed.add_field(name="Rôles qu'il avait", value=" ".join(roles[:10]), inline=False)

        await self._log(member.guild, embed)

    # ── Ban ────────────────────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_member_ban(self, guild: discord.Guild, user: discord.User):
        embed = discord.Embed(title="🔨 Membre banni", color=discord.Color.dark_red(), timestamp=datetime.now())
        embed.set_thumbnail(url=user.display_avatar.url)
        embed.add_field(name="Utilisateur", value=f"`{user}` (ID `{user.id}`)", inline=False)

        await self._log(guild, embed)

    # ── Unban ──────────────────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_member_unban(self, guild: discord.Guild, user: discord.User):
        embed = discord.Embed(title="✅ Membre débanni", color=discord.Color.green(), timestamp=datetime.now())
        embed.add_field(name="Utilisateur", value=f"`{user}` (ID `{user.id}`)", inline=False)
        await self._log(guild, embed)

    # ── Changement de rôle ─────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_member_update(self, before: discord.Member, after: discord.Member):
        added   = [r for r in after.roles  if r not in before.roles]
        removed = [r for r in before.roles if r not in after.roles]
        if not added and not removed:
            return

        embed = discord.Embed(title="🎭 Changement de rôle", color=discord.Color.blurple(), timestamp=datetime.now())
        embed.set_author(name=str(after), icon_url=after.display_avatar.url)
        embed.add_field(name="Membre", value=after.mention, inline=False)
        if added:
            embed.add_field(name="➕ Rôles ajoutés",   value=" ".join(r.mention for r in added),   inline=True)
        if removed:
            embed.add_field(name="➖ Rôles retirés",   value=" ".join(r.mention for r in removed), inline=True)

        await self._log(after.guild, embed)

    # ── Salon créé ─────────────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_guild_channel_create(self, channel: discord.abc.GuildChannel):
        embed = discord.Embed(title="➕ Salon créé", color=discord.Color.teal(), timestamp=datetime.now())
        embed.add_field(name="Nom",  value=f"**#{channel.name}**",             inline=True)
        embed.add_field(name="Type", value=str(channel.type).split(".")[-1],  inline=True)
        await self._log(channel.guild, embed)

    # ── Salon supprimé ─────────────────────────────────────────────────────────

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel: discord.abc.GuildChannel):
        embed = discord.Embed(title="🗑️ Salon supprimé", color=discord.Color.dark_grey(), timestamp=datetime.now())
        embed.add_field(name="Nom",  value=f"**#{channel.name}**",             inline=True)
        embed.add_field(name="Type", value=str(channel.type).split(".")[-1],  inline=True)
        await self._log(channel.guild, embed)


async def setup(bot: commands.Bot):
    await bot.add_cog(LogAll(bot))
