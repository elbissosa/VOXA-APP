import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { verifyPassword, generateToken } from "./_shared/auth.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const { email, password } = await req.json();
    if (!email || !password) return jsonResponse({ error: "Faltan credenciales" }, 400);

    const d = db();
    const users = await d.sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
    if (users.length === 0) return jsonResponse({ error: "Correo o contraseña incorrectos" }, 401);

    const user = users[0];
    if (!verifyPassword(password, user.password_hash)) {
      return jsonResponse({ error: "Correo o contraseña incorrectos" }, 401);
    }

    const token = generateToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await d.sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${user.id}, ${expires.toISOString()})`;

    delete user.password_hash;
    return jsonResponse({ token, user });
  } catch (err) {
    await logError("login", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno al iniciar sesión" }, 500);
  }
};

export const config = { path: "/api/auth/login" };
