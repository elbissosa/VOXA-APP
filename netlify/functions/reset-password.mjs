import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { hashPassword } from "./_shared/auth.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) return jsonResponse({ error: "Faltan datos" }, 400);
    if (newPassword.length < 6) return jsonResponse({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);

    const d = db();
    const rows = await d.sql`
      SELECT * FROM password_reset_tokens
      WHERE token = ${token} AND used = FALSE AND expires_at > NOW()
    `;
    if (rows.length === 0) {
      return jsonResponse({ error: "El enlace es inválido o ya expiró, solicita uno nuevo" }, 400);
    }

    const resetRow = rows[0];
    const passwordHash = hashPassword(newPassword);
    await d.sql`UPDATE users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${resetRow.user_id}`;
    await d.sql`UPDATE password_reset_tokens SET used = TRUE WHERE token = ${token}`;
    // Por seguridad, cerramos todas las sesiones activas de este usuario al cambiar la contraseña.
    await d.sql`UPDATE sessions SET revoked = TRUE WHERE user_id = ${resetRow.user_id}`;

    return jsonResponse({ ok: true });
  } catch (err) {
    await logError("reset-password", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno" }, 500);
  }
};

export const config = { path: "/api/auth/reset-password" };
