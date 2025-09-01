import Fastify from "fastify";
import cors from "@fastify/cors";
import { textSearch, placeDetail, placePhoto, scorePlace } from "./placesClient.js";
import { mapPlace } from "./mappers/placeMapper.js";
import { MIN_RATING, MIN_REVIEWS } from "./config/reco.js";
import { isTourismPlace } from "./config/tourismTypes.js";
import { prisma } from "@db/client";
import { authHook } from "./auth/jwt.js";
import { authRoutes } from "./routes/auth.js";
import { likesRoutes } from "./routes/likes.js";

// 캐시 TTL 설정
const DETAIL_TTL = Number(process.env.DETAIL_TTL_MS || 604800000);

// 거리 계산 함수 (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
	const R = 6371e3; // 지구 반지름 (미터)
	const φ1 = lat1 * Math.PI / 180;
	const φ2 = lat2 * Math.PI / 180;
	const Δφ = (lat2 - lat1) * Math.PI / 180;
	const Δλ = (lon2 - lon1) * Math.PI / 180;

	const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
		Math.cos(φ1) * Math.cos(φ2) *
		Math.sin(Δλ/2) * Math.sin(Δλ/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	return R * c; // 미터 단위
}

export function createApp() {
	const app = Fastify({ logger: true });
	app.register(cors as any, { origin: true });
	
	// Register auth hook globally
	app.addHook('preHandler', authHook);
	
	// Register routes
	app.register(authRoutes);
	app.register(likesRoutes);
	
	// 요청 제한을 위한 간단한 캐시 - 캐시 크기 제한 추가
	const requestCache = new Map<string, { data: any; timestamp: number }>();
	const CACHE_DURATION = 30000; // 30초 캐시
	const MAX_CACHE_SIZE = 100; // 최대 캐시 항목 수

	// 캐시 크기 제한 함수
	function limitCacheSize() {
		if (requestCache.size > MAX_CACHE_SIZE) {
			const entries = Array.from(requestCache.entries());
			// 가장 오래된 항목들을 제거
			entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
			const toDelete = entries.slice(0, requestCache.size - MAX_CACHE_SIZE);
			toDelete.forEach(([key]) => requestCache.delete(key));
		}
	}

	app.get("/health", async () => ({ ok: true }));

	// Debug endpoints
	app.get("/debug/env", async (req, reply) => {
		const key = process.env.GOOGLE_PLACES_BACKEND_KEY || "";
		return {
			hasKey: Boolean(key),
			keyLen: key.length || 0
		};
	});

	app.get("/debug/google/places/:id", async (req, reply) => {
		const { id } = req.params as any;
		const key = process.env.GOOGLE_PLACES_BACKEND_KEY!;
		if (!key) return reply.code(500).send({ error: "No backend Google key in env." });

		const FIELD_MASK_DETAIL = [
			"id",
			"displayName",
			"rating",
			"userRatingCount",
			"editorialSummary",
			"reviews",
			"photos",
			"location",
			"websiteUri",
			"internationalPhoneNumber",
			"priceLevel"
		].join(",");

		const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?fields=${encodeURIComponent(FIELD_MASK_DETAIL)}`;
		const res = await fetch(url, { headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK_DETAIL } });

		const text = await res.text();
		reply.code(res.status).headers({
			"x-upstream-status": String(res.status),
			"content-type": res.headers.get("content-type") || "application/json"
		}).send(text);
	});

	function mapLite(p: any) {
		return {
			id: p.id,
			displayName: p.displayName,
			rating: p.rating,
			userRatingCount: p.userRatingCount,
			photos: p.photos,
			editorialSummary: p.editorialSummary,
			location: p.location,
			primaryType: p.primaryType,
			types: p.types
		};
	}

	app.get("/v1/search", async (req, reply) => {
		try {
			const { q, lat, lng, onlyTourism, minRating, minReviews, sort, theme, region } = (req as any).query ?? {};

			// Handle empty q parameter - default to "한국 관광지"
			const safeQ = String((q ?? "")).trim();
			const query = safeQ.length > 0 ? safeQ : "한국 관광지";

			// Build a boosted query using theme/region when present
			const qBoosted = [region, theme, query].filter(Boolean).join(" ");

			// 캐시 키 생성
			const cacheKey = `${qBoosted}-${lat}-${lng}-${minRating}-${minReviews}-${sort}-${theme}-${region}`;
			const now = Date.now();
			const cached = requestCache.get(cacheKey);
			
			// 캐시된 데이터가 있고 유효한 경우 사용
			if (cached && (now - cached.timestamp) < CACHE_DURATION) {
				return cached.data;
			}

			// Call Google Places API
			const data = await textSearch(String(qBoosted || ""), lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
			
			// Map the data
			let arr = (data.places ?? data ?? []).map(mapLite);

			// Apply rating and review filters
			const mr = Number(minRating ?? MIN_RATING);
			const mv = Number(minReviews ?? MIN_REVIEWS);
			arr = arr.filter((p: any) => (p.rating ?? 0) >= mr && (p.userRatingCount ?? 0) >= mv);

			// Apply sorting
			const s = String(sort ?? "score");
			try {
				if (s === "score") arr.sort((a: any, b: any) => scorePlace(b) - scorePlace(a));
				else if (s === "rating") arr.sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0));
				else if (s === "reviews") arr.sort((a: any, b: any) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0));
			} catch (sortError) {
				// 무한루프 방지를 위해 로그 제거
			}

			// Limit results
			arr = arr.slice(0, 20);

			// 결과를 캐시에 저장하고 크기 제한
			requestCache.set(cacheKey, { data: arr, timestamp: now });
			limitCacheSize();

			return arr;
		} catch (error) {
			console.error("Search error:", error);
			return reply.code(500).send({ error: "Search failed", message: String(error) });
		}
	});

	app.get("/v1/places/:id", async (req, reply) => {
		const { id } = req.params as any;
		try {
			const raw = await placeDetail(String(id));
			return mapPlace(raw);
		} catch (e: any) {
			const msg = String(e?.message || e);
			
			const m = msg.match(/^UPSTREAM_(\d{3}):/);
			if (m) {
				const code = Number(m[1]);
				const body = msg.substring(msg.indexOf(':') + 1).substring(0, 300); // First 300 chars
				return reply.code(code).send({ error: "UpstreamError", status: code, message: body });
			}
			return reply.code(500).send({ error: "Internal", message: msg });
		}
	});

	app.get("/v1/places/:id/photos/media", async (req, reply) => {
		const { id } = (req as any).params;
		const { name, maxWidthPx } = (req as any).query ?? {};
		if (!name) {
			reply.status(400).send({ error: "name parameter is required" });
			return;
		}
		const w = maxWidthPx ? Number(maxWidthPx) : 1200;
		const { arrayBuf, contentType } = await placePhoto(String(id), String(name), w);
		reply.header("Content-Type", contentType).send(Buffer.from(arrayBuf));
	});

	app.get("/v1/autocomplete", async (req, reply) => {
		const { input } = (req as any).query ?? {};
		const key = process.env.GOOGLE_PLACES_BACKEND_KEY!;
		if (!input) return [];

		const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-Api-Key": key,
				"X-Goog-FieldMask": "suggestions.placePrediction.place, suggestions.placePrediction.text"
			},
			body: JSON.stringify({ input })
		});
		if (!res.ok) return reply.code(res.status).send(await res.text());
		const json = await res.json();
		return (json.suggestions ?? []).map((s: any) => ({
			id: s.placePrediction?.place?.id,
			text: s.placePrediction?.text?.text
		}));
	});

	app.get("/v1/regions", async () => {
		return ["전체","서울","부산","대구","대전","광주","인천","제주","강원","경주","전주"];
	});

	app.get("/v1/nearby", async (req, reply) => {
		const { lat, lng, category, radius, limit } = (req as any).query ?? {};
		if (!lat || !lng) return reply.code(400).send({ error: "lat,lng required" });
		
		// 카테고리별 검색 쿼리 매핑
		const categoryQueries: { [key: string]: string } = {
			restaurant: "맛집",
			cafe: "카페",
			shopping: "쇼핑",
			attraction: "관광지",
			hotel: "숙박",
			transport: "교통",
			entertainment: "엔터테인먼트",
			health: "의료"
		};
		
		const query = categoryQueries[category] || "주변 장소";
		const data = await textSearch(query, Number(lat), Number(lng));
		let places = (data.places ?? data ?? []).map(mapLite);
		
		// 거리 계산 및 필터링 (간단한 구현)
		if (radius) {
			const maxRadius = Number(radius);
			places = places.filter((place: any) => {
				if (!place.location) return false;
				const distance = calculateDistance(
					Number(lat), Number(lng),
					place.location.latitude, place.location.longitude
				);
				return distance <= maxRadius;
			});
		}
		
		// 결과 제한
		const resultLimit = limit ? Number(limit) : 20;
		return places.slice(0, resultLimit);
	});

	// 새로운 라우트들 추가
	app.get("/v1/detail/:placeId", async (req, reply) => {
		const placeId = String((req.params as any).placeId);
		const unifiedId = `google:${placeId}`;
		
		try {
			// 캐시 확인
			const cache = await prisma.placeCache.findUnique({ where: { placeId: unifiedId } });
			if (cache && Date.now() - new Date(cache.fetchedAt).getTime() < DETAIL_TTL) {
				return reply.send(cache.json);
			}
			
			// Google Places API 호출
			const raw = await placeDetail(placeId);
			const json = mapPlace(raw);
			
			// Ensure categories/types are included for frontend
			if (!json.categories && !json.types) {
				json.categories = raw.types || [];
			}
			
			// 캐시 저장
			await prisma.placeCache.upsert({
				where: { placeId: unifiedId },
				create: { placeId: unifiedId, json },
				update: { json, fetchedAt: new Date() }
			});
			
			return reply.send(json);
		} catch (error) {
			console.error('Detail fetch error:', error);
			return reply.code(500).send({ error: "Failed to fetch place details" });
		}
	});



	app.get("/v1/recommendations", async (req, reply) => {
		try {
			const { auth } = await import('./adapters/auth/index.js');
			const userId = await auth.getUserIdFromRequest(req) || 'dev-user';
			
			// 사용자의 좋아요 목록 조회
			const likes = await prisma.userLike.findMany({
				where: { userId },
				orderBy: { createdAt: 'desc' },
				take: 50
			});
			
			// 태그 가중치 계산
			const weight = new Map<string, number>();
			likes.forEach(l => {
				(l.tags || []).forEach(t => {
					weight.set(t, (weight.get(t) || 0) + 1);
				});
			});
			
			// 상위 3개 태그로 검색
			const topTags = [...weight.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 3)
				.map(([t]) => t);
			
			const query = topTags.length ? topTags.join(' ') : '한국 관광지';
			const results = await textSearch(query);
			
			reply.send(results || []);
		} catch (error) {
			console.error('Recommendations error:', error);
			return reply.code(500).send({ error: "Failed to get recommendations" });
		}
	});

	app.post("/v1/itineraries", async (req, reply) => {
		try {
			const { auth } = await import('./adapters/auth/index.js');
			const userId = await auth.getUserIdFromRequest(req) || 'dev-user';
			const { title, startDate, endDate, notes } = (req.body as any) || {};
			
			if (!title) {
				return reply.code(400).send({ message: 'missing title' });
			}
			
			const itinerary = await prisma.itinerary.create({
				data: {
					userId,
					title,
					startDate: startDate ? new Date(startDate) : null,
					endDate: endDate ? new Date(endDate) : null,
					notes
				}
			});
			
			reply.send(itinerary);
		} catch (error) {
			console.error('Create itinerary error:', error);
			return reply.code(500).send({ error: "Failed to create itinerary" });
		}
	});

	app.post("/v1/itineraries/:id/items", async (req, reply) => {
		try {
			const itineraryId = String((req.params as any).id);
			const { placeId, name, address, lat, lng, day, startTime, endTime, memo } = (req.body as any) || {};
			
			if (!placeId || !name) {
				return reply.code(400).send({ message: 'missing place info' });
			}
			
			const unifiedId = `google:${placeId}`;
			
			// Place 저장/업데이트
			await prisma.place.upsert({
				where: { id: unifiedId },
				create: { id: unifiedId, source: 'google', placeId, name, address, lat, lng, tags: [] },
				update: { name, address, lat, lng }
			});
			
			// ItineraryItem 생성
			const item = await prisma.itineraryItem.create({
				data: {
					itineraryId,
					placeId: unifiedId,
					day: day ?? null,
					startTime,
					endTime,
					memo
				}
			});
			
			reply.send(item);
		} catch (error) {
			console.error('Add itinerary item error:', error);
			return reply.code(500).send({ error: "Failed to add itinerary item" });
		}
	});

	return app;
}
