import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { generateToken } from "./_shared/auth.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const { email } = await req.json();
    if (!email) return jsonResponse({ error: "Falta el correo" }, 400);

    const d = db();
    const users = await d.sql`SELECT id, email FROM users WHERE email = ${email.toLowerCase()}`;

    if (users.length === 0) {
      return jsonResponse({ ok: true });
    }

    const user = users[0];
    const token = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await d.sql`INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (${token}, ${user.id}, ${expires.toISOString()})`;

    const siteUrl = Netlify.env.get("URL") || "https://voxa.netlify.app";
    const resetLink = `${siteUrl}/?resetToken=${token}`;

    const resendKey = Netlify.env.get("RESEND_API_KEY");
    if (resendKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: Netlify.env.get("EMAIL_FROM") || "VOXA <onboarding@resend.dev>",
            to: [user.email],
            subject: "Restablece tu contraseña de VOXA",
            html: `<p>Recibimos una solicitud para restablecer tu contraseña.</p><p><a href="${resetLink}">Haz clic aquí para crear una nueva contraseña</a></p><p>Este enlace expira en 1 hora. Si no fuiste tú, ignora este correo.</p>`,
          }),
        });
      } catch (emailErr) {
        await logError("forgot-password-email", emailErr.message, {});
      }
    } else {
      await logError("forgot-password-no-email-provider", "RESEND_API_KEY no configurada, enlace no enviado por correo", { resetLink });
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    await logError("forgot-password", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno" }, 500);
  }
};

export const config = { path: "/api/auth/forgot-password" };
