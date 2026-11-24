import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://the-fourth-dimension.pages.dev",
  trailingSlash: "never",
  // about.html, calendar.html, <slug>.html: Cloudflare Pages serves them at /about, /calendar, /<slug>
  build: { format: "file" },
  integrations: [sitemap({ filter: (page) => !page.includes("/404") })],
});
