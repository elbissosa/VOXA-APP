import { db, logError, logAdminAction, jsonResponse } from "./_shared/db.mjs";
import { requireAdmin } from "./_shared/session.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const admin = await requireAdmin(req);
    if (!admin) return jsonResponse({ error: "No autorizado" }, 401);

    const { key, value } = await req.json();
    const allowedKeys = ["maintenance_mode", "system_online"];
    if (!allowedKeys.includes(key)) return jsonResponse({ error: "Configuración no reconocida" }, 400);

    const d = db();
    await d.sql`
      INSERT INTO system_settings (key, value, updated_at) VALUES (${key}, ${String(value)}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${String(value)}, updated_at = NOW()
    `;
    await logAdminAction(admin.email, "toggle_system_setting", { key, value });

    return jsonResponse({ key, value: String(value) });
  } catch (err) {
    await logError("admin-system-toggle", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno" }, 500);
  }
};

export const config = { path: "/api/admin/system-toggle" };
