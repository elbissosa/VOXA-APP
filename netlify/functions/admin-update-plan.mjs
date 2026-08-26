import { db, logError, logAdminAction, jsonResponse } from "./_shared/db.mjs";
import { requireAdmin } from "./_shared/session.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const admin = await requireAdmin(req);
    if (!admin) return jsonResponse({ error: "No autorizado" }, 401);

    const { planSlug, priceCents, active } = await req.json();
    if (!planSlug) return jsonResponse({ error: "Falta el plan a modificar" }, 400);

    const d = db();
    if (priceCents !== undefined) {
      // Si cambia el precio, se limpia el stripe_price_id para que se cree un precio nuevo en Stripe
      await d.sql`UPDATE plans SET price_cents = ${priceCents}, stripe_price_id = NULL, updated_at = NOW() WHERE slug = ${planSlug}`;
    }
    if (active !== undefined) {
      await d.sql`UPDATE plans SET active = ${active}, updated_at = NOW() WHERE slug = ${planSlug}`;
    }
    await logAdminAction(admin.email, "update_plan", { planSlug, priceCents, active });

    const [updated] = await d.sql`SELECT * FROM plans WHERE slug = ${planSlug}`;
    return jsonResponse({ plan: updated });
  } catch (err) {
    await logError("admin-update-plan", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error interno" }, 500);
  }
};

export const config = { path: "/api/admin/update-plan" };
