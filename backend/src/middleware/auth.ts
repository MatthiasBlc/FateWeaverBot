import { RequestHandler } from "express";
import createHttpError from "http-errors";

// Middleware pour les utilisateurs authentifiés via session
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  next(createHttpError(401, "User not authenticated"));
};

// Middleware pour les appels internes entre services
export const requireInternal: RequestHandler = (req, res, next) => {
  // Pour le développement local, on accepte toutes les requêtes
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  // En production, on vérifie que la requête vient du réseau interne
  const clientIp =
    req.ip || (req.connection && req.connection.remoteAddress) || "";

  // Liste des plages d'IP considérées comme internes
  const isInternal = [
    "127.0.0.1", // localhost
    "::1", // IPv6 localhost
    "10.0.0.0/8", // réseau privé
    "172.16.0.0/12", // réseau privé
    "192.168.0.0/16", // réseau privé
    "fd00::/8", // IPv6 ULA
    "backend", // Nom du service dans Docker
    "bot", // Nom potentiel du service bot
  ].some((ip) => {
    if (ip.includes("/")) {
      // Vérification CIDR
      const [subnet, bits] = ip.split("/");
      return isInSubnet(clientIp, subnet, parseInt(bits, 10));
    }
    return clientIp.includes(ip);
  });

  if (isInternal) {
    return next();
  }

  console.log("Accès non autorisé depuis l'IP:", clientIp);
  next(createHttpError(403, "Accès non autorisé"));
};

// Fonction utilitaire pour vérifier si une IP est dans un sous-réseau CIDR
function isInSubnet(ip: string, subnet: string, prefix: number) {
  const ipParts = ip.split(".").map(Number);
  const subnetParts = subnet.split(".").map(Number);

  if (ipParts.length !== 4 || subnetParts.length !== 4) {
    return false;
  }

  for (let i = 0; i < 4; i++) {
    const shift = Math.max(0, 8 - Math.max(0, prefix - i * 8));
    const mask = shift < 8 ? ~(0xff >> shift) & 0xff : 0xff;

    if ((ipParts[i] & mask) !== (subnetParts[i] & mask)) {
      return false;
    }
  }

  return true;
}

// Middleware qui accepte soit une authentification utilisateur, soit un appel interne
export const requireAuthOrInternal: RequestHandler = (req, res, next) => {
  // En développement, on accepte toutes les requêtes
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  // Vérifier d'abord l'authentification par session
  if (req.session.userId) {
    return next();
  }

  // Ensuite vérifier si c'est un appel interne
  const clientIp =
    req.ip || (req.connection && req.connection.remoteAddress) || "";

  const isInternal = [
    "127.0.0.1",
    "::1",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "backend",
    "bot",
  ].some((ip) => {
    if (ip.includes("/")) {
      const [subnet, bits] = ip.split("/");
      return isInSubnet(clientIp, subnet, parseInt(bits, 10));
    }
    return clientIp.includes(ip);
  });

  if (isInternal) {
    return next();
  }

  console.log("Accès non autorisé depuis l'IP:", clientIp);
  next(createHttpError(401, "Authentication required"));
};
