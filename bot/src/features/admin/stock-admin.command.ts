/**
 * Entry point pour toutes les fonctions d'admin stock
 * Re-exporte les handlers depuis les modules spécialisés
 */

// Display
export { handleStockAdminCommand, handleStockAdminViewButton, handleStockAdminInfoButton } from "./stock-admin/stock-display";

// Add
export { handleStockAdminAddButton, handleStockAdminAddSelect, handleStockAdminAddModal } from "./stock-admin/stock-add";

// Remove
export { handleStockAdminRemoveButton, handleStockAdminRemoveSelect, handleStockAdminRemoveModal } from "./stock-admin/stock-remove";
