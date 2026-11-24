// Renders 1200x630 Open Graph images for posts that have no cover image, using the
// same drawn cover art the site shows. Also renders public/og/default.jpg.
//
// Usage: npm run build && npx astro preview   (in one terminal)
//        npm run og                          (in another; add --force to redo existing files)
// Optional: OG_BASE=http://localhost:4321 to point at another server.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Playwright is not a site dependency. Install it once with `npm i --no-save playwright && npx playwright install chromium`.
const { chromium } = await import("playwright").catch(() => createRequire(import.meta.url)("playwright"));

const BASE = process.env.OG_BASE || "http://localhost:4321";
const force = process.argv.includes("--force");
const outDir = path.resolve("public/og");
fs.mkdirSync(outDir, { recursive: true });

const postsDir = path.resolve("src/content/posts");
const jobs = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md")).flatMap((f) => {
  const slug = f.replace(/\.md$/, "");
  const fm = fs.readFileSync(path.join(postsDir, f), "utf8").split("---")[1] || "";
  if (/^cover:\s*\S/m.test(fm)) return [];
  return [{ slug, out: path.join(outDir, `${slug}.jpg`) }];
});
jobs.push({ slug: "default", out: path.join(outDir, "default.jpg") });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(BASE + "/about", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await Promise.all(['800 100px "Bricolage Grotesque"', '500 20px "IBM Plex Mono"'].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
});

for (const job of jobs) {
  if (!force && fs.existsSync(job.out)) { console.log("skip", path.relative(".", job.out)); continue; }
  const dataUrl = await page.evaluate((slug) => {
    const { ART, seedRng } = window.__t4dArt;
    const c = document.createElement("canvas"); c.width = 1200; c.height = 630;
    const ctx = c.getContext("2d");
    if (slug === "default") {
      ART.crown(ctx, 1200, 630, seedRng("fourth"));
      ctx.fillStyle = "#F3F1EA"; ctx.font = '800 108px "Bricolage Grotesque", Arial, sans-serif';
      ctx.shadowColor = "rgba(0,0,0,.55)"; ctx.shadowBlur = 24;
      ctx.fillText("The Fourth", 72, 300); ctx.fillText("Dimension", 72, 400);
      ctx.shadowBlur = 0; ctx.fillStyle = "#D3D5D9"; ctx.font = '500 28px "IBM Plex Mono", monospace';
      ctx.fillText("What you were trained not to see.", 76, 470);
    } else if (ART[slug]) {
      ART[slug](ctx, 1200, 630, seedRng(slug));
    } else return null;
    return c.toDataURL("image/jpeg", 0.86);
  }, job.slug);
  if (!dataUrl) { console.log("no art for", job.slug, "- add a cover image instead"); continue; }
  fs.writeFileSync(job.out, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("wrote", path.relative(".", job.out));
}
await browser.close();
