import Stripe from "stripe";
import { db, logError } from "./_shared/db.mjs";

export default async (req, context) => {
  const stripeKey = Netlify.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Netlify.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Stripe no configurado", { status: 500 });
  }
  const stripe = new Stripe(stripeKey);
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    await logError("stripe-webhook-verify", err.message, {});
    return new Response("Firma inválida", { status: 400 });
  }

  const d = db();
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const planSlug = session.metadata?.planSlug;
      if (userId) {
        await d.sql`
          UPDATE users
          SET plan = ${planSlug}, subscription_status = 'active', stripe_subscription_id = ${session.subscription}
          WHERE id = ${userId}
        `;
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      await d.sql`
        UPDATE users SET subscription_status = 'canceled', plan = 'inicial'
        WHERE stripe_subscription_id = ${sub.id}
      `;
    } else if (event.type === "customer.subscription.updated") {
      const sub = event.data.object;
      const status = sub.status === "active" ? "active" : sub.status;
      await d.sql`
        UPDATE users SET subscription_status = ${status}
        WHERE stripe_subscription_id = ${sub.id}
      `;
    }
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    await logError("stripe-webhook-handle", err.message, { stack: err.stack, eventType: event.type });
    return new Response("Error interno", { status: 500 });
  }
};

export const config = { path: "/api/billing/webhook" };
