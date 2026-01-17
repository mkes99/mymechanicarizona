export async function onRequestGet({ request, env, waitUntil }) {
  const FEED_URL =
    env.REVIEWS_FEED_URL || "https://data.accentapi.com/feed/25644748.json";

  const cache = caches.default;
  const url = new URL(request.url);

  // cache key can vary by querystring if you ever add params later
  const cacheKey = new Request(url.toString(), request);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(FEED_URL, {
    headers: { Accept: "application/json" },
  });

  // soft-fail (prevents hammering / 429 spirals)
  if (!upstream.ok) {
    const soft = new Response(
      JSON.stringify({
        ok: false,
        status: upstream.status,
        error: "Upstream feed unavailable",
        bio: null,
        reviews: [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      }
    );
    waitUntil(cache.put(cacheKey, soft.clone()));
    return soft;
  }

  const body = await upstream.text();

  const resp = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });

  waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}