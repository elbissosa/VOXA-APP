import { db, logError, jsonResponse } from "./_shared/db.mjs";

export default async (req, context) => {
  try {
    const d = db();
    const plans = await d.sql`SELECT slug, name, price_cents, max_cameras, max_destinations, locked_sections, locked_buttons FROM plans WHERE active = TRUE ORDER BY price_cents ASC`;
    return jsonResponse({ plans });
  } catch (err) {
    await logError("plans", err.message, { stack: err.stack });
    return jsonResponse({ error: "Error al obtener los planes" }, 500);
  }
};

export const config = { path: "/api/plans" };
