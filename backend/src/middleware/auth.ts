import { RequestHandler } from "express";
import createHttpError from "http-errors";

// Middleware pour les utilisateurs authentifiés via session
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  next(createHttpError(401, "User not authenticated"));
};

// Fonction utilitaire pour normaliser les adresses IP (gestion IPv6 mappé en IPv4)
function normalizeIp(ip: string): string {
  // Si c'est une adresse IPv6 mappée en IPv4 (format ::ffff:192.168.x.x)
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7); // Retourne uniquement la partie IPv4
  }
  return ip;
}

// Fonction pour vérifier si une IP est dans une plage donnée
function isIpInRange(ip: string, range: string): boolean {
  const normalizedIp = normalizeIp(ip);

  if (range.includes("/")) {
    // Vérification CIDR
    return isInSubnet(normalizedIp, range);
  }

  return normalizedIp === range;
}

// Middleware pour les appels internes entre services
export const requireInternal: RequestHandler = (req, res, next) => {
  // Pour le développement local, on accepte toutes les requêtes
  if (process.env.NODE_ENV === "development") {
    return next();
  }

  // En production, on vérifie que la requête vient du réseau interne
  const clientIp =
    req.ip || (req.connection && req.connection.remoteAddress) || "";
  const xForwardedFor = req.headers["x-forwarded-for"];
  const xRealIp = req.headers["x-real-ip"];

  // Log pour le débogage
  console.log(
    "Requête reçue - IP:",
    clientIp,
    "Normalisée:",
    normalizeIp(clientIp),
    "X-Forwarded-For:",
    xForwardedFor,
    "X-Real-IP:",
    xRealIp
  );

  // Liste des plages d'IP considérées comme internes
  const internalRanges = [
    // Réseaux privés standards
    "10.0.0.0/8",
    "172.16.0.0/12", // Inclut 172.16.0.0 à 172.31.255.255
    "172.17.0.0/16", // Réseau Docker par défaut (toutes les IP commençant par 172.17.x.x)
    "172.17.1.0/24", // Sous-réseau spécifique pour le conteneur
    "192.168.0.0/16",
    // Localhost
    "127.0.0.1",
    "::1",
    // Noms de conteneurs
    "fateweaver-backend",
    "fateweaver-discord-bot",
  ];

  // Vérifier si l'IP est dans une des plages internes
  const normalizedClientIp = normalizeIp(clientIp);

  // Log de débogage
  console.log("Vérification IP:", {
    originalIp: clientIp,
    normalizedIp: normalizedClientIp,
    internalRanges,
    isInternal: internalRanges.some((range) => {
      const result = isIpInRange(normalizedClientIp, range);
      console.log(
        `Vérification ${normalizedClientIp} dans ${range}: ${result}`
      );
      return result;
    }),
  });

  const isInternal = internalRanges.some((range) =>
    isIpInRange(normalizedClientIp, range)
  );

  console.log("Vérification IP interne:", {
    ip: clientIp,
    normalizedIp: normalizedClientIp,
    isInternal,
    internalRanges,
  });

  if (isInternal) {
    return next();
  }

  console.log("Accès non autorisé depuis l'IP:", {
    originalIp: clientIp,
    normalizedIp: normalizedClientIp,
    headers: {
      "x-forwarded-for": xForwardedFor,
      "x-real-ip": xRealIp,
      host: req.headers["host"],
    },
  });
  next(createHttpError(403, "Accès non autorisé"));
};

// Fonction utilitaire pour vérifier si une IP est dans un sous-réseau CIDR
function isInSubnet(ip: string, subnetRange: string): boolean {
  try {
    // Séparer l'adresse réseau et le masque
    const [subnet, bitsStr] = subnetRange.split("/");
    const bits = bitsStr ? parseInt(bitsStr, 10) : 32;

    // Convertir les adresses IP en tableaux de nombres
    const ipParts = ip.split(".").map(Number);
    const subnetParts = subnet.split(".").map(Number);

    // Vérifier le format des adresses
    if (
      ipParts.length !== 4 ||
      subnetParts.length !== 4 ||
      ipParts.some((part) => isNaN(part) || part < 0 || part > 255) ||
      subnetParts.some((part) => isNaN(part) || part < 0 || part > 255)
    ) {
      console.error(`Format d'IP invalide - IP: ${ip}, Subnet: ${subnetRange}`);
      return false;
    }

    // Vérifier chaque octet selon le masque
    for (let i = 0; i < 4; i++) {
      const bitsLeft = Math.max(0, bits - i * 8);
      if (bitsLeft >= 8) {
        // Tous les bits de cet octet doivent correspondre
        if (ipParts[i] !== subnetParts[i]) {
          return false;
        }
      } else if (bitsLeft > 0) {
        // Seuls les bits significatifs doivent correspondre
        const mask = 0xff << (8 - bitsLeft);
        if ((ipParts[i] & mask) !== (subnetParts[i] & mask)) {
          return false;
        }
      } else {
        // Masque épuisé, on a fini la vérification
        break;
      }
    }

    return true;
  } catch (error) {
    console.error("Erreur dans isInSubnet:", error, { ip, subnetRange });
    return false;
  }
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
  const normalizedClientIp = normalizeIp(clientIp);

  const internalRanges = [
    "10.0.0.0/8",
    "172.16.0.0/12",
    "172.17.0.0/16",
    "172.17.1.0/24",
    "192.168.0.0/16",
    "127.0.0.1",
    "::1",
    "fateweaver-backend",
    "fateweaver-discord-bot",
  ];

  const isInternal = internalRanges.some((range) =>
    isIpInRange(normalizedClientIp, range)
  );

  if (isInternal) {
    return next();
  }

  console.log("Accès non autorisé depuis l'IP:", {
    originalIp: clientIp,
    normalizedIp: normalizedClientIp,
    headers: {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      host: req.headers["host"],
    },
  });
  next(createHttpError(401, "Authentication required"));
};
