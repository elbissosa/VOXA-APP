import { getDatabase } from "@netlify/database";

export function db() {
  return getDatabase();
}

export async function logError(source, message, details) {
  try {
    const d = db();
    await d.sql`INSERT INTO error_logs (source, message, details) VALUES (${source}, ${message}, ${JSON.stringify(details || {})}::jsonb)`;
  } catch (e) {
    console.error("No se pudo registrar el error:", e);
  }
}

export async function logAdminAction(adminEmail, action, details) {
  const d = db();
  await d.sql`INSERT INTO admin_activity_log (admin_email, action, details) VALUES (${adminEmail}, ${action}, ${JSON.stringify(details || {})}::jsonb)`;
}

export function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
