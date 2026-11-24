import { getCollection, type CollectionEntry } from "astro:content";
import fs from "node:fs";
import path from "node:path";
import { SITE } from "./config";

export type Post = CollectionEntry<"posts">;

export async function getPosts(): Promise<Post[]> {
  const all = await getCollection("posts", (p) => !p.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export const postPath = (p: Post) => `/${p.id}`;
export const postUrl = (p: Post) => `${SITE}/${p.id}`;

/** Open Graph image: the post's cover, else a rendered cover in public/og/<slug>.jpg, else the site default. */
export function ogImage(p?: Post) {
  if (p?.data.cover) return SITE + p.data.cover;
  if (p && fs.existsSync(path.join(process.cwd(), "public/og", `${p.id}.jpg`))) return `${SITE}/og/${p.id}.jpg`;
  return `${SITE}/og/default.jpg`;
}
