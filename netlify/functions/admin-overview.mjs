import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { requireAdmin } from "./_shared/session.mjs";

export default async (req, context) => {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return jsonResponse({ error: "No autorizado" }, 401);

    const d = db();
    const [{ count: totalUsers }] = await d.sql`SELECT COUNT(*)::int AS count FROM users`;
    const byPlan = await d.sql`SELECT plan, COUNT(*)::int AS count FROM users GROUP BY plan`;
    const [{ count: activeSubs }] = await d.sql`SELECT COUNT(*)::int AS count FROM users WHERE subscription_status = 'active'`;
    const recentErrors = await d.sql`SELECT id, source, message, created_at FROM error_logs ORDER BY created_at DESC LIMIT 20`;
    const [{ count: errorCount24h }] = await d.sql`SELECT COUNT(*)::int AS count FROM error_logs WHERE created_at > NOW() - INTERVAL '24 hours'`;
    const settings = await d.sql`SELECT key, value FROM system_settings`;
    const plans = await d.sql`SELECT id, slug, name, price_cents, max_cameras, max_destinations, active FROM plans ORDER BY price_cents ASC`;
    const recentActivity = await d.sql`SELECT admin_email, action, details, created_at FROM admin_activity_log ORDER BY created_at DESC LIMIT 20`;

    const settingsObj = {};
    for (const row of settings) settingsObj[row.key] = row.value;

    return jsonResponse({
      totalUsers,
      byPlan,
      activeSubs,
      recentErrors,
      errorCount24h,
      settings: settingsObj,
      plans,
      recentActivity,
    });
  } catch (err) {
    await logError("admin-overview", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno" }, 500);
  }
};

export const config = { path: "/api/admin/overview" };
