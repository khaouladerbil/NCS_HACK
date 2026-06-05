"""
cogs/cog_setup.py
──────────────────
Configuration initiale du serveur :
  /setup-serveur   → crée tous les salons nécessaires automatiquement
  /set-channel     → pointer le bot vers un salon existant
"""

import discord
from discord.ext import commands
from discord import app_commands
import json
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def load_config():
    with open("config.json", "r", encoding="utf-8") as f:
        return json.load(f)

def save_config(cfg):
    with open("config.json", "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


class Setup(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    # ── /setup-serveur ─────────────────────────────────────────────────────────

    @app_commands.command(
        name="setup-serveur",
        description="[Admin] Crée automatiquement tous les salons nécessaires au bot"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def setup_serveur(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        cfg   = load_config()
        guild = interaction.guild

        # Salons à créer : nom affiché → clé dans config.json
        salons_a_creer = {
            "ecrire-votre-matricule": ("verification",  "📝 Écris ton matricule ici pour obtenir tes rôles."),
            "alertes-admin":          ("alertes",       "🚨 Alertes de sécurité du bot (usurpations, raids...)."),
            "logs-admin":             ("logs_admin",    "📋 Journal de toutes les actions de modération."),
            "logs-verifications":     ("logs",          "✅ Journal des vérifications réussies."),
        }

        crees   = []
        existent = []

        # Créer une catégorie dédiée
        categorie = discord.utils.get(guild.categories, name="Bot")
        if not categorie:
            categorie = await guild.create_category("Bot", reason="Catégorie créée par /setup-serveur")

        for nom_salon, (cle_config, description) in salons_a_creer.items():
            existant = discord.utils.get(guild.text_channels, name=nom_salon)

            if existant:
                existent.append(f"#{nom_salon}")
                cfg["channels"][cle_config] = nom_salon
            else:
                # Permissions : visible uniquement par les admins sauf pour le salon vérification
                if nom_salon == "ecrire-votre-matricule":
                    overwrites = {
                        guild.default_role: discord.PermissionOverwrite(
                            read_messages=True,
                            send_messages=True,
                            read_message_history=False
                        )
                    }
                else:
                    overwrites = {
                        guild.default_role: discord.PermissionOverwrite(read_messages=False),
                        guild.me:           discord.PermissionOverwrite(read_messages=True, send_messages=True),
                    }
                    for role in guild.roles:
                        if role.permissions.administrator:
                            overwrites[role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)

                salon = await guild.create_text_channel(
                    name=nom_salon,
                    category=categorie,
                    overwrites=overwrites,
                    topic=description,
                    reason="Créé par /setup-serveur"
                )
                cfg["channels"][cle_config] = nom_salon
                crees.append(salon.mention)

        save_config(cfg)

        # Message de bienvenue dans le salon de vérification
        verif_ch = discord.utils.get(guild.text_channels, name="ecrire-votre-matricule")
        if verif_ch and "ecrire-votre-matricule" in [c for c in crees if "#" not in c]:
            await verif_ch.send(
                "👋 **Bienvenue !**\n\n"
                "Pour accéder aux salons de ta promo, écris ton **numéro de matricule** ici.\n"
                "Le bot va t'envoyer un message privé pour confirmer ton identité.\n\n"
                "⚠️ Assure-toi que tes **messages privés sont activés** (paramètres du serveur)."
            )

        embed = discord.Embed(
            title="✅ Configuration terminée",
            color=discord.Color.green()
        )
        if crees:
            embed.add_field(name=f"🆕 Salons créés ({len(crees)})",      value="\n".join(crees),   inline=False)
        if existent:
            embed.add_field(name=f"✔️ Déjà existants ({len(existent)})", value="\n".join(existent), inline=False)

        embed.add_field(
            name="➡️ Prochaine étape",
            value="Lance `/check-config` pour vérifier les IDs de rôles dans ton `.env`",
            inline=False
        )
        await interaction.followup.send(embed=embed, ephemeral=True)

    # ── /set-channel ───────────────────────────────────────────────────────────

    @app_commands.command(
        name="set-channel",
        description="[Admin] Changer le salon utilisé par le bot pour une fonction"
    )
    @app_commands.describe(
        fonction="La fonction à reconfigurer",
        salon="Le salon à utiliser"
    )
    @app_commands.choices(fonction=[
        app_commands.Choice(name="Écrire les matricules",    value="verification"),
        app_commands.Choice(name="Alertes admin",            value="alertes"),
        app_commands.Choice(name="Logs modération",          value="logs_admin"),
        app_commands.Choice(name="Logs vérifications",       value="logs"),
        app_commands.Choice(name="Tickets",                  value="tickets"),
    ])
    @app_commands.checks.has_permissions(administrator=True)
    async def set_channel(
        self,
        interaction: discord.Interaction,
        fonction: str,
        salon: discord.TextChannel
    ):
        cfg = load_config()
        ancien = cfg["channels"].get(fonction, "non défini")
        cfg["channels"][fonction] = salon.name
        save_config(cfg)

        labels = {
            "verification": "Matricules",
            "alertes":      "Alertes admin",
            "logs_admin":   "Logs modération",
            "logs":         "Logs vérifications",
            "tickets":      "Tickets",
        }

        await interaction.response.send_message(
            f"✅ Salon **{labels.get(fonction, fonction)}** mis à jour :\n"
            f"`#{ancien}` → {salon.mention}",
            ephemeral=True
        )

    # ── /voir-config ───────────────────────────────────────────────────────────

    @app_commands.command(
        name="voir-config",
        description="[Admin] Voir la configuration actuelle des salons du bot"
    )
    @app_commands.checks.has_permissions(administrator=True)
    async def voir_config(self, interaction: discord.Interaction):
        cfg    = load_config()
        guild  = interaction.guild

        labels = {
            "verification": "📝 Matricules",
            "alertes":      "🚨 Alertes",
            "logs_admin":   "📋 Logs modération",
            "logs":         "✅ Logs vérifications",
            "tickets":      "🎫 Tickets",
        }

        embed = discord.Embed(title="⚙️ Configuration des salons", color=discord.Color.blurple())

        for cle, label in labels.items():
            nom   = cfg["channels"].get(cle, "non défini")
            salon = discord.utils.get(guild.text_channels, name=nom)
            statut = salon.mention if salon else f"❌ `#{nom}` introuvable"
            embed.add_field(name=label, value=statut, inline=True)

        embed.set_footer(text="Utilise /set-channel pour modifier un salon")
        await interaction.response.send_message(embed=embed, ephemeral=True)

    async def cog_app_command_error(self, interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot):
    await bot.add_cog(Setup(bot))