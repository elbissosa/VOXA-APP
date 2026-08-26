import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { hashPassword } from "./_shared/auth.mjs";

// Esta función crea o convierte una cuenta en administrador.
// Solo funciona si se envía la llave secreta SETUP_SECRET configurada en Netlify.
// Úsala UNA sola vez para crear tu cuenta de administrador, luego puedes borrar
// la variable SETUP_SECRET de Netlify para que nadie más pueda usarla.
export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const setupSecret = Netlify.env.get("SETUP_SECRET");
    if (!setupSecret) {
      return jsonResponse({ error: "SETUP_SECRET no está configurada en el servidor" }, 500);
    }

    const { secret, email, password, podcastName } = await req.json();
    if (secret !== setupSecret) {
      return jsonResponse({ error: "Llave secreta incorrecta" }, 401);
    }
    if (!email || !password) {
      return jsonResponse({ error: "Faltan correo y contraseña" }, 400);
    }

    const d = db();
    const passwordHash = hashPassword(password);
    const existing = await d.sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;

    let user;
    if (existing.length > 0) {
      [user] = await d.sql`
        UPDATE users SET is_admin = TRUE, password_hash = ${passwordHash}, plan = 'estudio_pro', subscription_status = 'active'
        WHERE email = ${email.toLowerCase()}
        RETURNING id, email, podcast_name, is_admin
      `;
    } else {
      [user] = await d.sql`
        INSERT INTO users (podcast_name, email, password_hash, plan, subscription_status, is_admin)
        VALUES (${podcastName || "VOXA Admin"}, ${email.toLowerCase()}, ${passwordHash}, 'estudio_pro', 'active', TRUE)
        RETURNING id, email, podcast_name, is_admin
      `;
    }

    return jsonResponse({ ok: true, user });
  } catch (err) {
    await logError("setup-admin", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno" }, 500);
  }
};

export const config = { path: "/api/setup-admin" };
