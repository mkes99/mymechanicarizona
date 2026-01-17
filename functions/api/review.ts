export async function onRequestGet({ request, env, waitUntil }) {
  const FEED_URL =
    env.REVIEWS_FEED_URL || "https://data.accentapi.com/feed/25644748.json";

  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString(), request);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(FEED_URL, { headers: { Accept: "application/json" } });

  if (!upstream.ok) {
    const soft = new Response(
      JSON.stringify({ ok: false, status: upstream.status, bio: null, reviews: [] }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } }
    );
    waitUntil(cache.put(cacheKey, soft.clone()));
    return soft;
  }

  const body = await upstream.text();
  const resp = new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });

  waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}