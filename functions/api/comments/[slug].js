import { guard, json, fail, ipHash, allow, readJson, clean, validCid, ownerHash } from "../../../server/api.js";

const MAX_NAME = 40, MAX_TEXT = 1000, MAX_LINKS = 3;
const NOT_YOURS = "You can only change comments posted from this browser.";

/** Shared checks for new and edited comments. Returns { name, text } or { error }. */
function check(body) {
  const name = clean(body.name, MAX_NAME).replace(/\s+/g, " ");
  const text = clean(body.text, MAX_TEXT);
  if (!text) return { error: "Write something first." };
  if (String(body.text).length > MAX_TEXT + 50 || String(body.name ?? "").length > MAX_NAME + 20) return { error: "That's too long." };
  if ((text.match(/https?:\/\//gi) || []).length > MAX_LINKS) return { error: `Up to ${MAX_LINKS} links per comment, please.` };
  return { name, text };
}

const shape = (r, mine) => ({ id: r.id, name: r.name, text: r.text, at: r.at, edited: r.edited || null, mine });

export async function onRequestGet(context) {
  const bad = await guard(context); if (bad) return bad;
  const cid = new URL(context.request.url).searchParams.get("cid");
  const me = validCid(cid) ? await ownerHash(cid) : null;
  const { results } = await context.env.DB.prepare(
    `SELECT id, name, body AS text, created_at AS at, edited_at AS edited, owner_hash AS owner
     FROM comments WHERE slug = ?1 AND hidden = 0 ORDER BY created_at DESC LIMIT 200`
  ).bind(context.params.slug).all();
  return json({ comments: results.map((r) => shape(r, !!me && r.owner === me)) });
}

export async function onRequestPost(context) {
  const bad = await guard(context); if (bad) return bad;
  const { request, env, params } = context;
  const body = await readJson(request);
  if (!body) return fail("That didn't look right. Try again.", 400);
  const now = new Date().toISOString();

  // Honeypot: people never see this field, bots fill it. Pretend it worked and store nothing.
  if (body.website) return json({ comment: { id: 0, name: clean(body.name, MAX_NAME), text: clean(body.text, MAX_TEXT), at: now, edited: null, mine: false } }, 201);

  const c = check(body);
  if (c.error) return fail(c.error, 400);

  const ip = await ipHash(request, env);
  if (!(await allow(env, "comment", ip, 3, 60)) || !(await allow(env, "comment", ip, 20, 86400)))
    return fail("You're commenting fast. Take a breath and try again in a minute.", 429);

  // Drop exact repeats from the same person on the same article.
  const dup = await env.DB.prepare(`SELECT 1 FROM comments WHERE slug = ?1 AND ip_hash = ?2 AND body = ?3 LIMIT 1`)
    .bind(params.slug, ip, c.text).first();
  if (dup) return fail("You already posted that.", 409);

  const owner = validCid(body.cid) ? await ownerHash(body.cid) : null;
  const row = await env.DB.prepare(
    `INSERT INTO comments (slug, name, body, created_at, ip_hash, owner_hash) VALUES (?1, ?2, ?3, ?4, ?5, ?6) RETURNING id`
  ).bind(params.slug, c.name, c.text, now, ip, owner).first();
  return json({ comment: { id: row.id, name: c.name, text: c.text, at: now, edited: null, mine: !!owner } }, 201);
}

/** Reads { id, cid } and returns the owner hash, or an error Response. */
async function owned(request) {
  const body = await readJson(request);
  if (!body || !Number.isInteger(body.id) || body.id < 1 || !validCid(body.cid)) return { res: fail("That didn't look right. Try again.", 400) };
  return { body, owner: await ownerHash(body.cid) };
}

export async function onRequestPatch(context) {
  const bad = await guard(context); if (bad) return bad;
  const { request, env, params } = context;
  const { res, body, owner } = await owned(request); if (res) return res;
  const c = check(body);
  if (c.error) return fail(c.error, 400);

  const ip = await ipHash(request, env);
  if (!(await allow(env, "edit", ip, 10, 60)) || !(await allow(env, "edit", ip, 60, 86400)))
    return fail("You're editing fast. Try again in a minute.", 429);

  const now = new Date().toISOString();
  const row = await env.DB.prepare(
    `UPDATE comments SET
       edited_at = CASE WHEN body <> ?3 OR name <> ?4 THEN ?5 ELSE edited_at END,
       body = ?3, name = ?4
     WHERE id = ?1 AND slug = ?2 AND owner_hash = ?6 AND hidden = 0
     RETURNING id, name, body AS text, created_at AS at, edited_at AS edited`
  ).bind(body.id, params.slug, c.text, c.name, now, owner).first();
  if (!row) return fail(NOT_YOURS, 403);
  return json({ comment: shape(row, true) });
}

export async function onRequestDelete(context) {
  const bad = await guard(context); if (bad) return bad;
  const { request, env, params } = context;
  const { res, body, owner } = await owned(request); if (res) return res;

  const ip = await ipHash(request, env);
  if (!(await allow(env, "delete", ip, 10, 60)) || !(await allow(env, "delete", ip, 60, 86400)))
    return fail("You're deleting fast. Try again in a minute.", 429);

  const r = await env.DB.prepare(`DELETE FROM comments WHERE id = ?1 AND slug = ?2 AND owner_hash = ?3`)
    .bind(body.id, params.slug, owner).run();
  if (!r.meta.changes) return fail(NOT_YOURS, 403);
  return json({ deleted: body.id });
}
