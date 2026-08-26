import { db } from "./db.mjs";

export async function getUserFromRequest(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  const d = db();
  const rows = await d.sql`
    SELECT u.* FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.revoked = FALSE AND s.expires_at > NOW()
  `;
  if (rows.length === 0) return null;
  const user = rows[0];
  delete user.password_hash;
  return user;
}

export async function requireAdmin(req) {
  const user = await getUserFromRequest(req);
  if (!user || !user.is_admin) return null;
  return user;
}
