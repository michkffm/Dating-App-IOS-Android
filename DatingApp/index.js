// Expo Router must start after consuming web account-link fragments. That
// prevents its history synchronization from restoring an already-used secret.
const { startAccountLinks } = require("./src/account-actions.cjs");
if (typeof window !== "undefined" && window.document && window.location) startAccountLinks(window);
require("expo-router/entry");
