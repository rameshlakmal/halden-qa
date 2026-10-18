// Files the setup project writes and later projects read. All under .auth/, which git ignores.
export const AUTH_DIR = '.auth';
export const STATE = {
  admin: `${AUTH_DIR}/admin.json`,
  support: `${AUTH_DIR}/support.json`,
  warehouse: `${AUTH_DIR}/warehouse.json`,
} as const;
/** Bearer tokens for staff, keyed by role, for the API layer. */
export const TOKENS = `${AUTH_DIR}/tokens.json`;
