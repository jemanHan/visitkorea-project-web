const BASE = (import.meta as any).env.VITE_API_BASE_URL ?? "http://localhost:3002";

// API 호출 캐싱을 위한 Map
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30초

export type PlaceLite = {
  id: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
  editorialSummary?: { text?: string };
  location?: { latitude?: number; longitude?: number };
};

// 캐시된 fetch 함수
async function cachedFetch(url: string, options?: RequestInit) {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const now = Date.now();
  const cached = apiCache.get(cacheKey);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const response = await fetch(url, { ...options, cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const data = await response.json();
  apiCache.set(cacheKey, { data, timestamp: now });
  
  // 캐시 크기 제한 (최대 50개)
  if (apiCache.size > 50) {
    const entries = Array.from(apiCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, apiCache.size - 50);
    toDelete.forEach(([key]) => apiCache.delete(key));
  }
  
  return data;
}

export async function searchPlaces(params: {
  q?: string; lat?: number; lng?: number;
  minRating?: number; minReviews?: number;
  sort?: "score"|"rating"|"reviews";
  onlyTourism?: boolean;
  theme?: string; region?: string;
  limit?: number;
}) {
  const u = new URL("/v1/search", BASE);
  if (params.q) u.searchParams.set("q", params.q);
  if (params.lat && params.lng) { u.searchParams.set("lat", String(params.lat)); u.searchParams.set("lng", String(params.lng)); }
  if (params.minRating) u.searchParams.set("minRating", String(params.minRating));
  if (params.minReviews) u.searchParams.set("minReviews", String(params.minReviews));
  if (params.sort) u.searchParams.set("sort", params.sort);
  if (params.theme) u.searchParams.set("theme", params.theme);
  if (params.region) u.searchParams.set("region", params.region);
  if (params.onlyTourism !== undefined) u.searchParams.set("onlyTourism", String(params.onlyTourism));
  
  const arr = await cachedFetch(u.toString());
  const list = Array.isArray(arr) ? arr : (arr?.places ?? []);
  return params.limit ? list.slice(0, params.limit) : list;
}

export async function fetchRegions() {
  return cachedFetch(`${BASE}/v1/regions`) as Promise<string[]>;
}

export async function autocomplete(input: string) {
  const u = new URL("/v1/autocomplete", BASE);
  u.searchParams.set("input", input);
  return cachedFetch(u.toString()) as Promise<Array<{id:string,text:string}>>;
}

export function photoUrl(placeId: string, photoName?: string, maxWidthPx = 1200) {
  if (!photoName) return null;
  const u = new URL(`/v1/places/${encodeURIComponent(placeId)}/photos/media`, BASE);
  u.searchParams.set("name", photoName);
  u.searchParams.set("maxWidthPx", String(maxWidthPx));
  return u.toString();
}

export async function fetchNearbyPlaces(params: {
  lat: number;
  lng: number;
  category: string;
  radius: number;
  limit?: number;
}) {
  const u = new URL("/v1/nearby", BASE);
  u.searchParams.set("lat", String(params.lat));
  u.searchParams.set("lng", String(params.lng));
  u.searchParams.set("category", params.category);
  u.searchParams.set("radius", String(params.radius));
  if (params.limit) u.searchParams.set("limit", String(params.limit));
  
  return cachedFetch(u.toString()) as Promise<PlaceLite[]>;
}
