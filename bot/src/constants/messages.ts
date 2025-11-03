// /bot/src/constants/messages.ts

import { STATUS } from "@shared/constants/emojis";

export const ERROR_MESSAGES = {
  // Système
  GUILD_ONLY: "Cette commande ne peut être utilisée que dans une guilde",
  UNKNOWN: "Une erreur inconnue est survenue",

  // Personnage
  NO_CHARACTER: `${STATUS.ERROR} Aucun personnage actif trouvé.`,
  CHARACTER_DEAD: `${STATUS.ERROR} Un personnage mort ne peut pas effectuer cette action.`,
  CHARACTER_DEAD_EXPEDITION: `${STATUS.ERROR} Aucun personnage vivant trouvé. Si votre personnage est mort, un mort ne peut pas rejoindre une expédition.`,
  CHARACTER_CREATION_REQUIRED: `${STATUS.ERROR} Vous devez d'abord créer un personnage avec la commande \`/profil\`.`,
  CHARACTER_NOT_FOUND: `${STATUS.ERROR} Personnage introuvable.`,

  // Ville/Guilde
  TOWN_NOT_FOUND: `${STATUS.ERROR} Aucune ville trouvée pour ce serveur.`,

  // Expéditions
  EXPEDITION_FETCH_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de la récupération des informations d'expédition.`,
  EXPEDITION_DEPARTED_NO_CITY_STOCK: `${STATUS.ERROR} Tu es en expédition et ne peux pas voir les stocks de la ville.\n\n Utilise \`/expedition\` pour voir les ressources de l'expédition.`,
  EXPEDITION_DEPARTED_NO_CITY_CHANTIER: `${STATUS.ERROR} Tu es en expédition et ne peux pas voir les chantiers de la ville. Ça aura peut être avancé d'ici ton retour !`,
  EXPEDITION_DEPARTED_NO_CRAFT: "Impossible de crafter en expédition DEPARTED",
  EXPEDITION_DEPARTED_NO_HARVEST: (action: string) => `Impossible de ${action} en expédition DEPARTED`,

  // Admin
  ADMIN_REQUIRED: `${STATUS.ERROR} Vous devez être administrateur pour utiliser cette commande.`,
  ADMIN_COMMAND_PREP_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de la préparation de la commande.`,
  ADMIN_STOCK_ADD_PREP_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de la préparation de l'ajout de ressources.`,
  ADMIN_STOCK_REMOVE_PREP_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de la préparation du retrait de ressources.`,
  ADMIN_STOCK_RESOURCE_SELECT_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de la sélection de la ressource.`,
  ADMIN_STOCK_DISPLAY_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de l'affichage de l'interface.`,
  ADMIN_STOCK_FETCH_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de la récupération des ressources.`,
  ADMIN_EXPEDITION_FETCH_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de la récupération des expéditions.`,
  ADMIN_EXPEDITION_DETAILS_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de la récupération des détails de l'expédition.`,
  ADMIN_EXPEDITION_EDIT_FORM_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de l'ouverture du formulaire de modification.`,
  ADMIN_EXPEDITION_MEMBERS_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de l'affichage de la gestion des membres.`,

  // Opérations génériques
  OPERATION_ERROR: (operation: string) => `${STATUS.ERROR} Une erreur est survenue lors de ${operation}.`,

  // Interactions
  NOT_YOUR_CAPABILITY: `${STATUS.ERROR} Vous ne pouvez utiliser que vos propres capacités.`,
  NOT_YOUR_PROFILE: `${STATUS.ERROR} Vous ne pouvez utiliser que votre propre profil.`,

  // Stock/Ressources
  INSUFFICIENT_PA: (current: number, required: number) => `${STATUS.ERROR} Vous n'avez pas assez de PA (${current}/${required} requis).`,

  // Repas
  EAT_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de l'action de manger.`,
  EAT_ADVANCED_MENU_ERROR: `${STATUS.ERROR} Erreur lors de l'affichage du menu avancé.`,
  EAT_CONSUMPTION_ERROR: `${STATUS.ERROR} Erreur lors de la consommation.`,
  MEAL_ERROR: "Une erreur est survenue lors du repas.",

  // Chantiers
  CHANTIER_FETCH_ERROR: "Une erreur est survenue lors de la récupération des chantiers.",
  CHANTIER_PARTICIPATE_ERROR: "Une erreur est survenue lors de la préparation de la participation.",
  CHANTIER_INVEST_ERROR: "Une erreur est survenue lors de la préparation de l'investissement.",
  CHANTIER_PROCESSING_ERROR: `${STATUS.ERROR} Une erreur est survenue lors du traitement de votre investissement. Veuillez réessayer.`,
  CHANTIER_DELETE_PREP_ERROR: "Une erreur est survenue lors de la préparation de la suppression.",
  CHANTIER_BUTTON_ERROR: `${STATUS.ERROR} Erreur lors de la participation au chantier.`,
  CHANTIER_ADD_RESOURCE_ERROR: `${STATUS.ERROR} Erreur lors de l'ajout de ressource.`,
  CHANTIER_CREATE_ERROR: `${STATUS.ERROR} Erreur lors de la création du chantier.`,

  // Cataplasme
  CATAPLASME_ERROR: "Une erreur est survenue lors de l'utilisation du cataplasme.",
  CATAPLASME_UNAVAILABLE: "Impossible d'utiliser le cataplasme.",

  // Admin
  ADMIN_INTERACTION_ERROR: `${STATUS.ERROR} Erreur lors du traitement de l'interaction d'administration.`,
  ADMIN_CAPABILITY_ERROR: `${STATUS.ERROR} Erreur lors du traitement de la gestion des capacités.`,
  ADMIN_STOCK_ADD_ERROR: `${STATUS.ERROR} Erreur lors de l'affichage de l'ajout de ressources.`,
  ADMIN_STOCK_REMOVE_ERROR: `${STATUS.ERROR} Erreur lors de l'affichage du retrait de ressources.`,

  // Capacités
  CAPABILITY_NOT_FOUND: `${STATUS.ERROR} Capacité non trouvée.`,
  CAPABILITY_DEAD: `${STATUS.ERROR} Vous ne pouvez pas utiliser de capacités avec un personnage mort.`,

  // Saison
  SEASON_FETCH_ERROR: `${STATUS.ERROR} Impossible de récupérer la saison actuelle.`,
  SEASON_INVALID_DATA: `${STATUS.ERROR} Format de données de saison invalide.`,
  SEASON_CHANGE_ERROR: (message: string) => `${STATUS.ERROR} Erreur lors du changement de saison : ${message}`,
};

export const SUCCESS_MESSAGES = {
  CATAPLASME_USED: (message: string) => `${STATUS.SUCCESS} ${message}`,
  CAPABILITY_USED: (name: string, details?: string) => `${STATUS.SUCCESS} **${name}** utilisée avec succès !${details ? '\n' + details : ''}`,
  SEASON_CHANGED: `${STATUS.SUCCESS} Saison changée avec succès`,
};

export const INFO_MESSAGES = {
  CHARACTER_STATUS_UNKNOWN: `${STATUS.ERROR} Impossible de déterminer l'état de votre personnage. Veuillez contacter un administrateur.`,
  PROFILE_ERROR: `${STATUS.ERROR} Une erreur est survenue lors de l'affichage de votre profil.`,
  REROLL_PROMPT: `${STATUS.ERROR} Votre personnage est mort. Utilisez la commande de reroll pour créer un nouveau personnage.`,
};
