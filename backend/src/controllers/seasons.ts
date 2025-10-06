import { RequestHandler } from "express";
import { prisma } from "../util/db";

/**
 * Récupère la saison actuelle
 */
export const getCurrentSeason: RequestHandler = async (req, res) => {
  try {
    // Récupérer la saison actuelle (il n'y en a qu'une seule avec id = 1)
    const season = await prisma.season.findUnique({
      where: { id: 1 }
    });

    if (!season) {
      // Créer une saison par défaut si elle n'existe pas
      const defaultSeason = await prisma.season.create({
        data: {
          id: 1,
          name: "SUMMER"
        }
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
