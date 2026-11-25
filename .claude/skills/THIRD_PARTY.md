# Third-party skills

Copied unchanged (MIT licence, each folder keeps its LICENSE) so they work in Claude Code sessions on this repo, including from mobile.

| Skills | Source | Version |
|---|---|---|
| blog, blog-write, blog-rewrite, blog-seo-check, blog-schema, blog-repurpose, blog-analyze, blog-outline | https://github.com/AgriciDaniel/claude-blog | v2.3.2 |
| gsap-core, gsap-timeline, gsap-plugins, gsap-scrolltrigger, gsap-utils, gsap-performance | https://github.com/greensock/gsap-skills | main, Nov 2026 |
| convert-documents-to-markdown (anydoc) | https://github.com/firecrawl/anydoc | main, Nov 2026 |

Notes
- claude-blog: only the writing, SEO, schema, repurpose and analysis skills are included. Its optional Python checks need `pip install textstat beautifulsoup4`.
- anydoc: runs locally with `npx -y @firecrawl/anydoc`. Do NOT use `--ocr hosted` on private documents (it uploads them to Firecrawl).
- Not included: claude-drawing-skill (its instructions file is ~740 KB and would flood the context window).
