import Stripe from "stripe";
import { db, logError, jsonResponse } from "./_shared/db.mjs";
import { getUserFromRequest } from "./_shared/session.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonResponse({ error: "No autorizado, inicia sesión" }, 401);

    const { planSlug } = await req.json();
    const d = db();
    const [plan] = await d.sql`SELECT * FROM plans WHERE slug = ${planSlug} AND active = TRUE`;
    if (!plan) return jsonResponse({ error: "Plan no encontrado" }, 404);

    const stripeKey = Netlify.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return jsonResponse({ error: "Stripe no está configurado en el servidor" }, 500);
    const stripe = new Stripe(stripeKey);

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.podcast_name });
      customerId = customer.id;
      await d.sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${user.id}`;
    }

    const siteUrl = Netlify.env.get("URL") || "https://voxa.netlify.app";

    let priceId = plan.stripe_price_id;
    if (!priceId) {
      const price = await stripe.prices.create({
        unit_amount: plan.price_cents,
        currency: "usd",
        recurring: { interval: "month" },
        product_data: { name: `VOXA — Plan ${plan.name}` },
      });
      priceId = price.id;
      await d.sql`UPDATE plans SET stripe_price_id = ${priceId} WHERE id = ${plan.id}`;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/?checkout=success`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
      metadata: { userId: String(user.id), planSlug },
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    await logError("create-checkout-session", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error al crear la sesión de pago" }, 500);
  }
};

export const config = { path: "/api/billing/create-checkout-session" };
