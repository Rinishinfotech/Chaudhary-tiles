// Maps each app route to the permission key required to access it.
// null  => always accessible (Dashboard)
// '__admin__' => only Super Admin / Admin
// otherwise => requires user.permissions[<key>] to be true
export const PATH_PERM = {
  '/dashboard': null,
  '/employees': '__admin__',
  '/settings': '__admin__',
  '/wallet': '__admin__',
  '/parties': 'party',
  '/receipts': 'receipt',
  '/expenses': 'expense',
  '/dispatch': 'dispatch',
  '/stock': 'stock',
  '/production': 'production',
  '/dchallan': 'dchallan',
  '/reports': 'reports',
};

export function isAdminRole(user) {
  return !!user && (user.role === 'Super Admin' || user.role === 'Admin');
}

export function canAccess(user, path) {
  if (!user) return false;
  if (isAdminRole(user)) return true;
  const perm = PATH_PERM[path];
  if (perm === null || perm === undefined) return true; // Dashboard / unknown-safe pages
  if (perm === '__admin__') return false;               // admin-only pages
  return !!(user.permissions && user.permissions[perm]);
}
