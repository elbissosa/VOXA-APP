import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { hashPassword, generateToken } from "./_shared/auth.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const { podcastName, email, password } = await req.json();
    if (!podcastName || !email || !password) {
      return jsonResponse({ error: "Faltan datos: nombre del podcast, correo y contraseña" }, 400);
    }
    if (password.length < 6) {
      return jsonResponse({ error: "La contraseña debe tener al menos 6 caracteres" }, 400);
    }
    const d = db();
    const existing = await d.sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return jsonResponse({ error: "Ya existe una cuenta con ese correo" }, 409);
    }
    const passwordHash = hashPassword(password);
    const [user] = await d.sql`
      INSERT INTO users (podcast_name, email, password_hash, plan, subscription_status)
      VALUES (${podcastName}, ${email.toLowerCase()}, ${passwordHash}, 'inicial', 'inactive')
      RETURNING id, podcast_name, email, plan, subscription_status
    `;
    const token = generateToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await d.sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${user.id}, ${expires.toISOString()})`;

    return jsonResponse({ token, user });
  } catch (err) {
    await logError("register", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno al crear la cuenta" }, 500);
  }
};

export const config = { path: "/api/auth/register" };
