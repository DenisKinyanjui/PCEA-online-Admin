// ─── Single-church configuration ──────────────────────────────────────────────
// The admin panel manages ONE church. All sermon lists are scoped to it, new
// sermons and users are assigned to it, and "Church Profile" edits its record.
//
// CHURCH_NAME must match the `church` string stored on sermons exactly, and
// CHURCH_SLUG must match the slug the public site loads (VITE_CHURCH_SLUG there).
//
// MULTI-CHURCH: the previous multi-tenant admin (church list, church switcher,
// per-user church assignment) is kept commented out — search for "MULTI-CHURCH".

export const CHURCH_NAME = import.meta.env.VITE_CHURCH_NAME ?? 'P.C.E.A Emmanuel Thome Church';
export const CHURCH_SLUG = import.meta.env.VITE_CHURCH_SLUG ?? 'pcea-emmanuel-thome-church';
