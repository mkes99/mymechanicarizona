function pick(obj: any, keys: string[], fallback: any = null) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return fallback;
}

function normalizeReview(r: any, i: number) {
  const reviewer = r?.reviewer || r?.author || r?.user || r?.profile || {};
  return {
    id: String(pick(r, ["id", "review_id", "reviewId", "name"], i)),
    created_time: pick(r, ["created_time", "createTime", "time", "createdAt", "date"], null),
    rating: Number(pick(r, ["rating", "starRating", "stars", "score"], 0)) || 0,
    review_text: pick(r, ["review_text", "text", "comment", "content", "message"], ""),
    reviewer_name: pick(
      r,
      ["reviewer_name", "author_name"],
      pick(reviewer, ["name", "displayName"], "Anonymous")
    ),
    reviewer_photo_link: pick(
      r,
      ["reviewer_photo_link", "profile_photo_url", "profilePhotoUrl", "avatar"],
      pick(reviewer, ["photo", "profilePhotoUrl", "avatarUrl"], null)
    ),
    reviewer_link: pick(r, ["reviewer_link", "author_url", "authorUrl", "url"], null),
  };
}

function normalizeBio(feed: any) {
  const bio = feed?.bio || feed?.business || feed?.place || {};
  return {
    name: pick(bio, ["name", "title"], null),
    place_id: pick(bio, ["place_id", "placeId"], null),
    link: pick(bio, ["link", "url"], null),
    overall_star_rating: Number(pick(bio, ["overall_star_rating", "rating", "avg_rating", "averageRating"], null)),
    rating_count: Number(pick(bio, ["rating_count", "user_ratings_total", "totalReviews", "reviewCount"], null)),
  };
}

export async function onRequestGet({ request, env, waitUntil }: any) {
  const FEED_URL =
    env.REVIEWS_FEED_URL || "https://data.accentapi.com/feed/25644748.json";

  const cache = caches.default;
  const url = new URL(request.url);
  const cacheKey = new Request(url.toString(), request);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(FEED_URL, { headers: { Accept: "application/json" } });

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
          "content-type": "application/json",
          "cache-control": "public, max-age=60",
        },
      }
    );
    waitUntil(cache.put(cacheKey, soft.clone()));
    return soft;
  }

  const feed = await upstream.json();

  const rawReviews =
    feed?.reviews ||
    feed?.data ||
    feed?.items ||
    feed?.results ||
    [];

  const normalized = {
    ok: true,
    bio: normalizeBio(feed),
    reviews: Array.isArray(rawReviews) ? rawReviews.map(normalizeReview) : [],
    fetched_at: new Date().toISOString(),
  };

  const resp = new Response(JSON.stringify(normalized), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });

  waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}