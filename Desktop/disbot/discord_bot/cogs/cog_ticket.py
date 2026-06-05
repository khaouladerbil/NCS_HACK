"""
cogs/cog_ticket.py
───────────────────
Système de tickets :
  /setup-tickets      → envoie le message avec bouton "Ouvrir un ticket"
  /fermer-ticket      → ferme le ticket (dans le salon ticket)
  /transcript         → sauvegarde la conversation avant fermeture
  /ajouter-ticket @m  → ajouter un membre au ticket
"""

import discord
from discord.ext import commands
from discord import app_commands
from datetime import datetime
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.helpers import load_config, load_json, save_json

TICKETS_PATH = "data/tickets.json"


# ── Vue persistante : bouton Ouvrir un ticket ──────────────────────────────────

class TicketButton(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(
        label="Ouvrir un ticket",
        style=discord.ButtonStyle.primary,
        emoji="🎫",
        custom_id="ticket:open"
    )
    async def open_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        guild    = interaction.guild
        member   = interaction.user
        config   = load_config()
        tickets  = load_json(TICKETS_PATH)

        # Vérifier si l'utilisateur a déjà un ticket ouvert
        existing = next(
            (ch for ch in guild.text_channels if ch.name == f"ticket-{member.name.lower().replace(' ','-')}"),
            None
        )
        if existing:
            await interaction.response.send_message(
                f"❌ Tu as déjà un ticket ouvert : {existing.mention}", ephemeral=True
            )
            return

        # Trouver la catégorie ou créer le salon
        category = discord.utils.get(guild.categories, name="Tickets")

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(read_messages=False),
            member:             discord.PermissionOverwrite(read_messages=True, send_messages=True),
            guild.me:           discord.PermissionOverwrite(read_messages=True, send_messages=True, manage_channels=True),
        }
        # Ajouter les rôles admin
        for role in guild.roles:
            if role.permissions.administrator or role.permissions.manage_guild:
                overwrites[role] = discord.PermissionOverwrite(read_messages=True, send_messages=True)

        salon = await guild.create_text_channel(
            name=f"ticket-{member.name.lower().replace(' ', '-')}",
            category=category,
            overwrites=overwrites,
            reason=f"Ticket de {member}"
        )

        # Sauvegarder
        tickets[str(salon.id)] = {
            "owner_id":  str(member.id),
            "owner":     str(member),
            "opened_at": datetime.now().isoformat(),
            "guild_id":  str(guild.id)
        }
        save_json(TICKETS_PATH, tickets)

        # Message d'accueil dans le ticket
        embed = discord.Embed(
            title="🎫 Ticket ouvert",
            description=(
                f"Bienvenue {member.mention} !\n\n"
                "Décris ton problème ou ta demande en détail.\n"
                "Un modérateur va te répondre rapidement.\n\n"
                "Utilise `/fermer-ticket` pour fermer ce ticket."
            ),
            color=discord.Color.blurple()
        )
        embed.set_footer(text=f"Ticket de {member} | {datetime.now().strftime('%d/%m/%Y %H:%M')}")

        close_view = CloseTicketView()
        await salon.send(embed=embed, view=close_view)

        await interaction.response.send_message(
            f"✅ Ton ticket a été créé : {salon.mention}", ephemeral=True
        )


# ── Vue : bouton Fermer dans le ticket ─────────────────────────────────────────

class CloseTicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Fermer le ticket", style=discord.ButtonStyle.danger, emoji="🔒", custom_id="ticket:close")
    async def close(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.defer()
        await _close_ticket(interaction.channel, interaction.user, interaction.guild)


# ── Fonction de fermeture partagée ─────────────────────────────────────────────

async def _close_ticket(channel: discord.TextChannel, closer: discord.Member, guild: discord.Guild):
    tickets = load_json(TICKETS_PATH)
    config  = load_config()
    info    = tickets.get(str(channel.id), {})

    # Générer le transcript
    transcript_lines = [f"=== Transcript du ticket {channel.name} ===\n"]
    async for msg in channel.history(limit=500, oldest_first=True):
        if not msg.author.bot or msg.embeds:
            line = f"[{msg.created_at.strftime('%d/%m/%Y %H:%M')}] {msg.author}: {msg.content}"
            transcript_lines.append(line)

    transcript_text = "\n".join(transcript_lines)

    # Envoyer le transcript en DM au propriétaire du ticket
    owner_id = info.get("owner_id")
    if owner_id:
        owner = guild.get_member(int(owner_id))
        if owner:
            try:
                await owner.send(
                    f"📋 Voici le transcript de ton ticket **{channel.name}** :",
                    file=discord.File(
                        fp=__import__('io').StringIO(transcript_text),
                        filename=f"transcript-{channel.name}.txt"
                    )
                )
            except Exception:
                pass

    # Envoyer dans le salon logs
    logs_ch = discord.utils.get(guild.text_channels, name=config["channels"]["logs_admin"])
    if logs_ch:
        embed = discord.Embed(
            title="🔒 Ticket fermé",
            color=discord.Color.red(),
            timestamp=datetime.now()
        )
        embed.add_field(name="Salon",        value=channel.name,                  inline=True)
        embed.add_field(name="Propriétaire", value=info.get("owner","?"),         inline=True)
        embed.add_field(name="Fermé par",    value=str(closer),                   inline=True)
        embed.add_field(name="Ouvert le",    value=info.get("opened_at","?")[:10], inline=True)
        await logs_ch.send(
            embed=embed,
            file=discord.File(
                fp=__import__('io').StringIO(transcript_text),
                filename=f"transcript-{channel.name}.txt"
            )
        )

    # Supprimer le ticket du JSON et le salon
    if str(channel.id) in tickets:
        del tickets[str(channel.id)]
        save_json(TICKETS_PATH, tickets)

    await channel.send("🔒 Ticket fermé. Suppression dans 5 secondes...")
    await __import__('asyncio').sleep(5)
    await channel.delete(reason=f"Ticket fermé par {closer}")


# ── Cog principal ──────────────────────────────────────────────────────────────

class Ticket(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot    = bot
        self.config = load_config()
        bot.add_view(TicketButton())
        bot.add_view(CloseTicketView())

    # ── /setup-tickets ─────────────────────────────────────────────────────────

    @app_commands.command(name="setup-tickets", description="[Admin] Envoyer le message d'ouverture de ticket")
    @app_commands.checks.has_permissions(administrator=True)
    async def setup_tickets(self, interaction: discord.Interaction):
        embed = discord.Embed(
            title="🎫 Support — Ouvre un ticket",
            description=(
                "Tu as un problème ou une question ?\n\n"
                "Clique sur le bouton ci-dessous pour ouvrir un ticket privé avec l'équipe.\n"
                "Un modérateur te répondra dès que possible."
            ),
            color=discord.Color.blurple()
        )
        await interaction.channel.send(embed=embed, view=TicketButton())
        await interaction.response.send_message("✅ Message de ticket envoyé.", ephemeral=True)

    # ── /fermer-ticket ─────────────────────────────────────────────────────────

    @app_commands.command(name="fermer-ticket", description="Fermer ce ticket")
    async def fermer_ticket(self, interaction: discord.Interaction):
        tickets = load_json(TICKETS_PATH)
        if str(interaction.channel.id) not in tickets:
            await interaction.response.send_message("❌ Ce salon n'est pas un ticket.", ephemeral=True)
            return
        await interaction.response.defer()
        await _close_ticket(interaction.channel, interaction.user, interaction.guild)

    # ── /ajouter-ticket ────────────────────────────────────────────────────────

    @app_commands.command(name="ajouter-ticket", description="[Mod] Ajouter un membre à ce ticket")
    @app_commands.describe(membre="Le membre à ajouter")
    @app_commands.checks.has_permissions(manage_channels=True)
    async def ajouter_ticket(self, interaction: discord.Interaction, membre: discord.Member):
        tickets = load_json(TICKETS_PATH)
        if str(interaction.channel.id) not in tickets:
            await interaction.response.send_message("❌ Ce salon n'est pas un ticket.", ephemeral=True)
            return
        await interaction.channel.set_permissions(membre, read_messages=True, send_messages=True)
        await interaction.response.send_message(f"✅ {membre.mention} ajouté au ticket.", ephemeral=True)

    async def cog_app_command_error(self, interaction, error):
        if isinstance(error, app_commands.MissingPermissions):
            if not interaction.response.is_done():
                await interaction.response.send_message("🚫 Permission refusée.", ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Ticket(bot))
