"""
cogs/cog_stats.py
──────────────────
Statistiques de vérification :
  - /stats            → vue globale (total vérifié, par section, par groupe)
  - /stats-section    → détail d'une section spécifique
"""

import discord
from discord.ext import commands
from discord import app_commands
import json
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.data_manager import load_used_matricules, load_students


class Stats(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot      = bot
        self.guild_id = int(os.getenv("GUILD_ID"))

    # ── /stats ─────────────────────────────────────────────────────────────────

    @app_commands.command(
        name="stats",
        description="Affiche les statistiques globales des vérifications"
    )
    async def stats(self, interaction: discord.Interaction):
        await interaction.response.defer(ephemeral=True)

        used      = load_used_matricules()
        etudiants = load_students()

        total_etudiants = len(etudiants)
        total_verifies  = len(used)
        taux            = (total_verifies / total_etudiants * 100) if total_etudiants > 0 else 0

        # Compter par section et groupe en croisant avec la liste
        sections: dict[str, int] = {}
        groupes:  dict[str, int] = {}

        for matricule in used:
            etudiant = etudiants[etudiants["matricule"] == matricule]
            if not etudiant.empty:
                row     = etudiant.iloc[0]
                section = str(row.get("section", "")).strip().upper()
                groupe  = str(row.get("groupe_td", "")).strip().upper()
                sections[section] = sections.get(section, 0) + 1
                groupes[groupe]   = groupes.get(groupe,  0) + 1

        embed = discord.Embed(
            title="📊 Statistiques de vérification",
            color=discord.Color.blurple()
        )

        # Barre de progression ASCII
        filled = int(taux / 10)
        barre  = "█" * filled + "░" * (10 - filled)

        embed.add_field(
            name="🎓 Global",
            value=(
                f"**{total_verifies}** / {total_etudiants} étudiants vérifiés\n"
                f"`{barre}` {taux:.1f}%"
            ),
            inline=False
        )

        if sections:
            sec_text = "\n".join(
                f"Section **{s}** : {n} étudiant{'s' if n > 1 else ''}"
                for s, n in sorted(sections.items())
            )
            embed.add_field(name="📚 Par section", value=sec_text, inline=True)

        if groupes:
            grp_text = "\n".join(
                f"Groupe TD **{g}** : {n} étudiant{'s' if n > 1 else ''}"
                for g, n in sorted(groupes.items())
            )
            embed.add_field(name="👥 Par groupe TD", value=grp_text, inline=True)

        embed.set_footer(text="Données issues de data/used_matricules.json")

        await interaction.followup.send(embed=embed, ephemeral=True)

    # ── /stats-section ─────────────────────────────────────────────────────────

    @app_commands.command(
        name="stats-section",
        description="Détail des vérifications pour une section donnée"
    )
    @app_commands.describe(section="Lettre de la section (ex: A, B, C)")
    async def stats_section(self, interaction: discord.Interaction, section: str):
        await interaction.response.defer(ephemeral=True)

        section   = section.strip().upper()
        used      = load_used_matricules()
        etudiants = load_students()

        section_df = etudiants[etudiants["section"].str.strip().str.upper() == section]
        if section_df.empty:
            await interaction.followup.send(f"❌ Section **{section}** introuvable.", ephemeral=True)
            return

        total    = len(section_df)
        verifies = section_df[section_df["matricule"].isin(used.keys())]
        non_verif = section_df[~section_df["matricule"].isin(used.keys())]

        embed = discord.Embed(
            title=f"📚 Section {section} — Détail",
            color=discord.Color.green()
        )
        taux = len(verifies) / total * 100 if total > 0 else 0
        embed.add_field(
            name="Progression",
            value=f"**{len(verifies)}** / {total} vérifiés ({taux:.1f}%)",
            inline=False
        )

        # Groupes dans cette section
        for groupe, grp_df in section_df.groupby(section_df["groupe_td"].str.strip().str.upper()):
            verif_count = sum(1 for m in grp_df["matricule"] if m in used)
            embed.add_field(
                name=f"Groupe {groupe}",
                value=f"{verif_count} / {len(grp_df)} vérifiés",
                inline=True
            )

        # Liste des non-vérifiés (max 10)
        if not non_verif.empty:
            liste = "\n".join(
                f"`{row['matricule']}` — {row.get('prenom','')} {row.get('nom','')}"
                for _, row in non_verif.head(10).iterrows()
            )
            if len(non_verif) > 10:
                liste += f"\n_... et {len(non_verif)-10} autres_"
            embed.add_field(name="⏳ Non vérifiés", value=liste, inline=False)

        await interaction.followup.send(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    await bot.add_cog(Stats(bot))
