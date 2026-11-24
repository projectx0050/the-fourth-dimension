import { guard, json, fail, ipHash, allow, readJson, clean } from "../../../server/api.js";

const MAX_NAME = 40, MAX_TEXT = 1000, MAX_LINKS = 3;

export async function onRequestGet(context) {
  const bad = await guard(context); if (bad) return bad;
  const { results } = await context.env.DB.prepare(
    `SELECT name, body AS text, created_at AS at FROM comments WHERE slug = ?1 AND hidden = 0 ORDER BY created_at DESC LIMIT 200`
  ).bind(context.params.slug).all();
  return json({ comments: results });
}

export async function onRequestPost(context) {
  const bad = await guard(context); if (bad) return bad;
  const { request, env, params } = context;
  const body = await readJson(request);
  if (!body) return fail("That didn't look right. Try again.", 400);

  const name = clean(body.name, MAX_NAME).replace(/\s+/g, " ");
  const text = clean(body.text, MAX_TEXT);
  const now = new Date().toISOString();

  // Honeypot: people never see this field, bots fill it. Pretend it worked and store nothing.
  if (body.website) return json({ comment: { name, text, at: now } }, 201);

  if (!text) return fail("Write something first.", 400);
  if (String(body.text).length > MAX_TEXT + 50 || String(body.name ?? "").length > MAX_NAME + 20) return fail("That's too long.", 400);
  if ((text.match(/https?:\/\//gi) || []).length > MAX_LINKS) return fail(`Up to ${MAX_LINKS} links per comment, please.`, 400);

  const ip = await ipHash(request, env);
  if (!(await allow(env, "comment", ip, 3, 60)) || !(await allow(env, "comment", ip, 20, 86400)))
    return fail("You're commenting fast. Take a breath and try again in a minute.", 429);

  // Drop exact repeats from the same person on the same article.
  const dup = await env.DB.prepare(`SELECT 1 FROM comments WHERE slug = ?1 AND ip_hash = ?2 AND body = ?3 LIMIT 1`)
    .bind(params.slug, ip, text).first();
  if (dup) return fail("You already posted that.", 409);

  await env.DB.prepare(`INSERT INTO comments (slug, name, body, created_at, ip_hash) VALUES (?1, ?2, ?3, ?4, ?5)`)
    .bind(params.slug, name, text, now, ip).run();
  return json({ comment: { name, text, at: now } }, 201);
}
