// Shared helpers for the Pages Functions in /functions/api.

export const REACTIONS = ["felt", "disturbed", "think", "disagree"];

// Same statements as migrations/0001_init.sql, so the site still works if nobody ran the migration.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL, name TEXT NOT NULL DEFAULT '', body TEXT NOT NULL, created_at TEXT NOT NULL, ip_hash TEXT, hidden INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS comments_by_slug ON comments (slug, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS reactions (slug TEXT NOT NULL, client_id TEXT NOT NULL, reaction TEXT NOT NULL, updated_at TEXT NOT NULL, ip_hash TEXT, PRIMARY KEY (slug, client_id))`,
  `CREATE INDEX IF NOT EXISTS reactions_by_slug ON reactions (slug, reaction)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, window_start INTEGER NOT NULL, count INTEGER NOT NULL)`,
];
let schemaReady = false;

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });
}
export const fail = (error, status) => json({ error }, status);

/** Checks the DB binding and the slug. Returns an error Response, or null when the request can go ahead. */
export async function guard(context) {
  const { env, params, request } = context;
  if (!env.DB) return fail("Comments and reactions aren't switched on yet.", 503);
  if (!schemaReady) {
    await env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s)));
    schemaReady = true;
  }
  const slug = String(params.slug || "");
  if (!/^[a-z0-9-]{1,120}$/.test(slug) || !(await knownSlugs(env, request)).has(slug)) return fail("Unknown article.", 404);
  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) return fail("Forbidden.", 403);
  }
  return null;
}

let slugCache = null, slugCacheAt = 0;
async function knownSlugs(env, request) {
  if (slugCache && Date.now() - slugCacheAt < 60_000) return slugCache;
  try {
    const r = await env.ASSETS.fetch(new URL("/posts.json", request.url));
    slugCache = new Set(await r.json());
    slugCacheAt = Date.now();
  } catch (e) {
    slugCache = slugCache || new Set();
  }
  return slugCache;
}

export async function ipHash(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const data = new TextEncoder().encode(`${env.IP_SALT || "t4d-salt"}:${ip}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Fixed-window counter. Returns true when this hit is within the limit. */
export async function allow(env, action, ip, limit, windowSec) {
  const win = Math.floor(Date.now() / 1000 / windowSec);
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1 ELSE 1 END,
       window_start = excluded.window_start
     RETURNING count`
  ).bind(`${action}:${windowSec}:${ip}`, win).first();
  return (row?.count ?? 1) <= limit;
}

export async function readJson(request, maxBytes = 8000) {
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

/** Trim, drop control characters (keeping new lines), squash long blank runs. */
export function clean(s, max) {
  return String(s ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}
