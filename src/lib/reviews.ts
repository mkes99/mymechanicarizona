export type Review = {
  author_name?: string;
  author_photo?: string;
  rating?: number;
  text?: string;
  created_time?: string;
  url?: string;
};

export type ReviewsFeed = {
  bio?: {
    name?: string;
    rating?: number;
    rating_count?: number;
    url?: string;
    updated_at?: string;
  };
  reviews?: Review[];
};

export async function fetchReviewsFeed(feedUrl: string): Promise<ReviewsFeed> {
  const res = await fetch(feedUrl, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Reviews feed failed: ${res.status}`);

  return (await res.json()) as ReviewsFeed;
}

export function stars(rating = 0) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
}