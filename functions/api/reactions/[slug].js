import { guard, json, fail, ipHash, allow, readJson, REACTIONS } from "../../../server/api.js";

const validCid = (c) => typeof c === "string" && /^[A-Za-z0-9-]{8,64}$/.test(c);

async function state(env, slug, cid) {
  const [counts, mine] = await env.DB.batch([
    env.DB.prepare(`SELECT reaction, COUNT(*) AS n FROM reactions WHERE slug = ?1 GROUP BY reaction`).bind(slug),
    env.DB.prepare(`SELECT reaction FROM reactions WHERE slug = ?1 AND client_id = ?2`).bind(slug, cid || ""),
  ]);
  const out = {};
  for (const r of counts.results) if (REACTIONS.includes(r.reaction)) out[r.reaction] = r.n;
  return { counts: out, mine: mine.results[0]?.reaction ?? null };
}

export async function onRequestGet(context) {
  const bad = await guard(context); if (bad) return bad;
  const cid = new URL(context.request.url).searchParams.get("cid");
  return json(await state(context.env, context.params.slug, validCid(cid) ? cid : ""));
}

export async function onRequestPost(context) {
  const bad = await guard(context); if (bad) return bad;
  const { request, env, params } = context;
  const body = await readJson(request, 1000);
  if (!body || !validCid(body.cid)) return fail("That didn't look right. Try again.", 400);
  const reaction = body.reaction ?? null;
  if (reaction !== null && !REACTIONS.includes(reaction)) return fail("Unknown reaction.", 400);

  const ip = await ipHash(request, env);
  if (!(await allow(env, "react", ip, 30, 60)) || !(await allow(env, "react", ip, 300, 86400)))
    return fail("Too many taps. Try again in a minute.", 429);

  if (reaction === null) {
    await env.DB.prepare(`DELETE FROM reactions WHERE slug = ?1 AND client_id = ?2`).bind(params.slug, body.cid).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO reactions (slug, client_id, reaction, updated_at, ip_hash) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(slug, client_id) DO UPDATE SET reaction = excluded.reaction, updated_at = excluded.updated_at, ip_hash = excluded.ip_hash`
    ).bind(params.slug, body.cid, reaction, new Date().toISOString(), ip).run();
  }
  return json(await state(env, params.slug, body.cid));
}
