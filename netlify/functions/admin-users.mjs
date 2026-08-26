import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { requireAdmin } from "./_shared/session.mjs";

export default async (req, context) => {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return jsonResponse({ error: "No autorizado" }, 401);

    const d = db();
    const users = await d.sql`
      SELECT id, podcast_name, email, plan, subscription_status, is_admin, created_at
      FROM users ORDER BY created_at DESC LIMIT 200
    `;
    return jsonResponse({ users });
  } catch (err) {
    await logError("admin-users", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno" }, 500);
  }
};

export const config = { path: "/api/admin/users" };
