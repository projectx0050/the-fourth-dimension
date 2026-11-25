import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts, postUrl, ogImage } from "../lib";
import { SITE, SITE_NAME, SITE_DESCRIPTION } from "../config";

/** RSS feed of every published post, newest first. Auto-posters and Medium's importer read this. */
export async function GET(_context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: SITE,
    trailingSlash: false,
    xmlns: { media: "http://search.yahoo.com/mrss/", dc: "http://purl.org/dc/elements/1.1/" },
    customData: `<language>en</language><image><url>${SITE}/og/default.jpg</url><title>${SITE_NAME}</title><link>${SITE}/</link></image>`,
    items: posts.map((p) => ({
      title: p.data.title,
      link: postUrl(p),
      pubDate: p.data.date,
      description: p.data.description || p.data.dek,
      categories: [p.data.front],
      content: p.rendered?.html,
      customData: `<dc:creator><![CDATA[${p.data.author}]]></dc:creator><media:content url="${ogImage(p)}" medium="image" />`,
    })),
  });
}
