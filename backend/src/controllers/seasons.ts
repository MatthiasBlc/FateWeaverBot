import { RequestHandler } from "express";
import { prisma } from "../util/db";

/**
 * Récupère la saison actuelle
 */
export const getCurrentSeason: RequestHandler = async (req, res) => {
  try {
    // Récupérer la saison actuelle (il n'y en a qu'une seule avec id = 1)
    const season = await prisma.season.findUnique({
      where: { id: 1 },
    });

    if (!season) {
      // Créer une saison par défaut si elle n'existe pas
      const defaultSeason = await prisma.season.create({
        data: {
          id: 1,
          name: "SUMMER",
        },
      });
      res.json(defaultSeason);
    } else {
      res.json(season);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de la saison:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Définit une nouvelle saison
 */
export const setSeason: RequestHandler = async (req, res) => {
  try {
    const { season: newSeason, adminId } = req.body;

    if (!newSeason || !["SUMMER", "WINTER"].includes(newSeason.toUpperCase())) {
      return res
        .status(400)
        .json({ error: "Saison invalide. Utilisez SUMMER ou WINTER" });
    }

    // Récupérer la saison actuelle
    const currentSeason = await prisma.season.findUnique({
      where: { id: 1 },
    });

    if (!currentSeason) {
      return res.status(404).json({ error: "Saison actuelle introuvable" });
    }

    const oldSeason = currentSeason.name;

    // Mettre à jour la saison
    const updatedSeason = await prisma.season.update({
      where: { id: 1 },
      data: {
        name: newSeason.toUpperCase(),
        updatedAt: new Date(),
      },
    });

    // Créer un log du changement si adminId est fourni
    if (adminId) {
      // TODO: Implémenter le logging des changements de saison
      // await prisma.seasonChangeLog.create({...});
      console.log(
        `Saison changée de ${oldSeason} à ${newSeason.toUpperCase()} par admin ${adminId}`
      );
    }

    res.json({
      oldSeason: oldSeason,
      newSeason: updatedSeason.name,
      publicMessage: `🌤️ La saison a été changée de **${oldSeason}** à **${updatedSeason.name}** !`,
    });
  } catch (error) {
    console.error("Erreur lors du changement de saison:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Vérifie si la saison a changé récemment (dans les dernières 24h)
 * Utilisé par le cron job du bot pour envoyer des notifications
 */
export const checkSeasonChange: RequestHandler = async (req, res) => {
  try {
    // Récupérer la saison actuelle
    const season = await prisma.season.findUnique({
      where: { id: 1 },
    });

    if (!season) {
      return res.json({
        changed: false,
        message: "Aucune saison configurée",
      });
    }

    // Vérifier si la saison a été mise à jour dans les dernières 24h
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hasChangedRecently = season.updatedAt > twentyFourHoursAgo;

    if (!hasChangedRecently) {
      return res.json({
        changed: false,
        message: "Pas de changement de saison récent",
      });
    }

    // TODO: Récupérer les données complètes de la saison (température, précipitations, etc.)
    // Pour l'instant, on retourne des données simplifiées
    const seasonData = {
      name: getSeasonDisplayName(season.name),
      temperature: getSeasonTemperature(season.name),
      precipitation: getSeasonPrecipitation(season.name),
      description: getSeasonDescription(season.name),
    };

    res.json({
      changed: true,
      oldSeason: null, // TODO: Implémenter un système de logs pour récupérer l'ancienne saison
      newSeason: seasonData,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du changement de saison:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
 * Fonctions utilitaires pour les données de saison
 */
function getSeasonDisplayName(name: string): string {
  const names: Record<string, string> = {
    SUMMER: "Été",
    WINTER: "Hiver",
    SPRING: "Printemps",
    AUTUMN: "Automne",
  };
  return names[name] || name;
}

function getSeasonTemperature(name: string): number {
  const temps: Record<string, number> = {
    SUMMER: 28,
    WINTER: -5,
    SPRING: 15,
    AUTUMN: 12,
  };
  return temps[name] || 20;
}

function getSeasonPrecipitation(name: string): number {
  const precips: Record<string, number> = {
    SUMMER: 20,
    WINTER: 60,
    SPRING: 50,
    AUTUMN: 70,
  };
  return precips[name] || 40;
}

function getSeasonDescription(name: string): string {
  const descriptions: Record<string, string> = {
    SUMMER: "Les journées sont chaudes et ensoleillées, parfaites pour les expéditions.",
    WINTER: "Le froid s'installe, les ressources se font plus rares. Attention aux provisions !",
    SPRING: "La nature renaît, les récoltes sont abondantes.",
    AUTUMN: "Les feuilles tombent, il est temps de faire des réserves pour l'hiver.",
  };
  return descriptions[name] || "Une nouvelle saison commence...";
}
