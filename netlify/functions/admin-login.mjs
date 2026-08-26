import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { verifyPassword, generateToken } from "./_shared/auth.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const { email, password } = await req.json();
    if (!email || !password) return jsonResponse({ error: "Faltan credenciales" }, 400);

    const d = db();
    const users = await d.sql`SELECT * FROM users WHERE email = ${email.toLowerCase()} AND is_admin = TRUE`;
    if (users.length === 0) return jsonResponse({ error: "Acceso denegado" }, 401);

    const user = users[0];
    if (!verifyPassword(password, user.password_hash)) {
      return jsonResponse({ error: "Acceso denegado" }, 401);
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 12 * 60 * 60 * 1000); // sesión admin dura 12 horas
    await d.sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${user.id}, ${expires.toISOString()})`;

    return jsonResponse({ token, email: user.email });
  } catch (err) {
    await logError("admin-login", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno" }, 500);
  }
};

export const config = { path: "/api/admin/login" };
