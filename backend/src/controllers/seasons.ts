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
