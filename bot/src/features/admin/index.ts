/**
 * Admin Features barrel export
 * Centralizes all admin-related modules
 *
 * Note: Some handlers have overlapping exports and should be imported explicitly
 */

// Sub-module exports
export * from './character-admin/index.js';
export * from './elements/index.js';
export * from './projects-admin/index.js';
export * from './stock-admin/index.js';

// Direct admin handlers (import explicitly to avoid conflicts)
// export * from './character-admin.handlers.js';
// export * from './element-capability-admin.handlers.js';
// export * from './element-object-admin.handlers.js';
// export * from './element-resource-admin.handlers.js';
// export * from './element-skill-admin.handlers.js';
// export * from './emoji-admin.handlers.js';
// export * from './expedition-admin.handlers.js';
// export * from './expedition-admin-resource-handlers.js';
// export * from './new-element-admin.handlers.js';

// Components
// export * from './character-admin.components.js';
