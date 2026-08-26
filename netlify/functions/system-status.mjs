import { db, logError, jsonResponse } from "./_shared/db.mjs";

export default async (req, context) => {
  try {
    const d = db();
    const settings = await d.sql`SELECT key, value FROM system_settings WHERE key IN ('maintenance_mode', 'system_online')`;
    const obj = {};
    for (const row of settings) obj[row.key] = row.value === "true";
    return jsonResponse({
      systemOnline: obj.system_online !== false,
      maintenanceMode: obj.maintenance_mode === true,
    });
  } catch (err) {
    await logError("system-status", err.message, { stack: err.stack });
    return jsonResponse({ systemOnline: true, maintenanceMode: false });
  }
};

export const config = { path: "/api/system-status" };
