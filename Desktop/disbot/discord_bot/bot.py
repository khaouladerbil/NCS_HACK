"""
bot.py — Point d'entrée du bot Discord.
"""
import sys
# Force la sortie console en UTF-8 (sinon les emojis plantent sur Windows/cp1252)
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

import discord
from discord.ext import commands
import os, asyncio
from dotenv import load_dotenv

load_dotenv()
TOKEN    = os.getenv("DISCORD_TOKEN")
GUILD_ID = int(os.getenv("GUILD_ID"))

intents = discord.Intents.default()
intents.members         = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

COGS = [
    # ── Vérification étudiants ──────────────────────────────
    "cogs.cog_verification",
    "cogs.cog_anti_usurpation",
    "cogs.cog_logs",
    "cogs.cog_stats",
    "cogs.cog_welcome",
    "cogs.cog_admin",
    "cogs.cog_sync",
    "cogs.cog_setup",
    # ── Modération & sécurité ───────────────────────────────
    "cogs.cog_warn",
    "cogs.cog_mute",
    "cogs.cog_lock",
    "cogs.cog_tempban",
    "cogs.cog_antispam",
    "cogs.cog_newaccount",
    # ── Outils admin ────────────────────────────────────────
    "cogs.cog_ticket",
    "cogs.cog_automsg",
    "cogs.cog_logall",
    "cogs.cog_userinfo",
    "cogs.cog_remind",
]

@bot.event
async def on_ready():
    guild = discord.Object(id=GUILD_ID)
    # Les commandes des cogs sont dans l'arbre GLOBAL : il faut les copier
    # vers le serveur avant de synchroniser, sinon aucune slash command
    # n'apparaît (sync guild d'un arbre vide).
    bot.tree.copy_global_to(guild=guild)
    synced = await bot.tree.sync(guild=guild)
    print(f"╔══════════════════════════════════════╗")
    print(f"║  Bot connecté : {bot.user}")
    print(f"║  Cogs chargés : {len(bot.cogs)}")
    print(f"║  Commandes slash : {len(synced)}")
    print(f"╚══════════════════════════════════════╝")

async def main():
    async with bot:
        for cog in COGS:
            try:
                await bot.load_extension(cog)
                print(f"  ✅ {cog}")
            except Exception as e:
                print(f"  ❌ {cog} : {e}")
        await bot.start(TOKEN)

if __name__ == "__main__":
    asyncio.run(main())