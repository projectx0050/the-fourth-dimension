# The Fourth Dimension

*What you were trained not to see.*

A blog about the hidden layer of reality, for the general public. Live at https://the-fourth-dimension.pages.dev.

Built with Astro as a static site, hosted on Cloudflare Pages. Comments and reactions run on Pages Functions with a D1 database. See **[DEPLOY.md](DEPLOY.md)** for setup.

## Add a new post

1. Create `src/content/posts/<slug>.md`. The file name becomes the URL: `/<slug>`.
2. Start it with:

   ```md
   ---
   title: "The Title"
   dek: "One line under the title."
   front: Society          # Society, Mind, Screen, Machine...
   date: 2026-12-01
   read: 3 min
   cover: /covers/my-cover.jpg        # 16:9, about 1600x900. Also used as the share image.
   thumb: /covers/my-cover-thumb.jpg  # optional small version for the list
   ---
   ```

3. Write the post in Markdown. Use `##` for subheads and `>` for pull quotes.
   Wrap a line in `<span class="key">…</span>` to give it a dotted "share this line" underline.
4. Put cover images in `public/covers/`. Add `draft: true` to keep a post hidden.
5. Commit and push to `main`. Cloudflare rebuilds the site.

The newest post becomes the lead story on the home page.

Other content you might edit: the "Coming soon" list is in `src/data/upcoming.json`, calendar days are in `src/data/events.json`, and the Substack signup URL is in `src/config.ts`.

## Develop

```sh
npm install
npm run dev        # site only (comments/reactions need Cloudflare: see below)
npm run build      # outputs dist/
npx wrangler pages dev dist --d1 DB=local   # site + API + local D1
```

## Layout

- `src/pages/`: home, `[slug]` article, about, calendar, 404
- `src/scripts/`: lens masthead (GSAP), cover art, share-this-line, listen, reactions/comments, calendar
- `functions/api/`: `comments/[slug]` and `reactions/[slug]` (Pages Functions)
- `server/api.js`: shared API helpers (validation, rate limits, honeypot)
- `migrations/`: D1 schema
- `public/og/`: share images for posts without a cover. Make them with `npm run og` (needs Playwright and a running `astro preview`).
- `design/`: the approved prototype and covers, kept for reference
