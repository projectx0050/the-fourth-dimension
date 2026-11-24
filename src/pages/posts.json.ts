import { getPosts } from "../lib";

/** List of published slugs. The comments and reactions API uses it to reject unknown slugs. */
export async function GET() {
  const posts = await getPosts();
  return new Response(JSON.stringify(posts.map((p) => p.id)), { headers: { "content-type": "application/json" } });
}
