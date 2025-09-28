/**
 * 한국관광공사 TourAPI 프론트엔드 클라이언트
 */

import { tourApi } from '../lib/apiClient';

// 환경별 API URL 자동 감지 (apiClient와 동일한 로직 사용)
function getApiBaseUrl(): string {
  // 환경변수가 있으면 우선 사용
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 프로덕션 빌드인지 확인
  if (import.meta.env.PROD) {
    // 프로덕션: 동일 오리진 상대 경로 사용
    return '';
  }
  
  // 개발: Vite 프록시 사용
  return '/api';
}

// API 기본 URL
const API_BASE_URL = getApiBaseUrl();

// API 호출 제한 및 캐싱
const requestCache = new Map<string, { data: any; timestamp: number }>();
const REQUEST_DELAY = 1000; // 1초 대기
const CACHE_DURATION = 30 * 60 * 1000; // 30분 캐시

// 간소화된 fetch 함수 - apiClient 사용 + 캐싱
async function cachedTourApiFetch(url: string): Promise<any> {
  // URL에서 endpoint 부분만 추출
  const endpoint = url.includes('/v1/') ? url.split('/v1/')[1] : url.replace(API_BASE_URL, '');
  const cacheKey = endpoint;
  
  // 캐시 확인
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('🚀 캐시에서 데이터 반환:', endpoint);
    return cached.data;
  }
  
  // API 호출 제한
  await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
  
  try {
    const data = await tourApi.get(`/v1/${endpoint}`);
    requestCache.set(cacheKey, { data, timestamp: Date.now() });
    console.log('📡 API 호출:', `/v1/${endpoint}`);
    return data;
  } catch (error) {
    console.error('❌ API 호출 실패:', endpoint, error);
    throw error;
  }
}

export interface TourItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2: string;
  mapx: string;
  mapy: string;
  tel: string;
  firstimage: string;
  firstimage2: string;
  overview: string;
  cat1: string;
  cat2: string;
  cat3: string;
  areacode: string;
  sigungucode: string;
  createdtime: string;
  modifiedtime: string;
}

export interface TourApiResponse<T> {
  success: boolean;
  data: T[];
  count: number;
  center?: {
    mapX: number;
    mapY: number;
  };
}

/**
 * 강남구 주변 관광지 조회
 */
export async function getGangnamTours(
  radius: number = 2000,
  contentTypeId: string = '12',
  numOfRows: number = 20
): Promise<TourItem[]> {
  try {
    const url = `${API_BASE_URL}/v1/tour/gangnam?radius=${radius}&contentTypeId=${contentTypeId}&numOfRows=${numOfRows}`;
    const result: TourApiResponse<TourItem> = await cachedTourApiFetch(url);
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch Gangnam tours:', error);
    return [];
  }
}

/**
 * 지역기반 관광지 조회
 */
export async function getAreaBasedTours(
  areaCode: string = '1',
  contentTypeId: string = '12',
  numOfRows: number = 10,
  pageNo: number = 1
): Promise<TourItem[]> {
  try {
    const url = `${API_BASE_URL}/v1/tour/area-based?areaCode=${areaCode}&contentTypeId=${contentTypeId}&numOfRows=${numOfRows}&pageNo=${pageNo}`;
    const result: TourApiResponse<TourItem> = await cachedTourApiFetch(url);
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch area based tours:', error);
    return [];
  }
}

/**
 * 좌표반경 관광지 검색
 */
export async function getLocationBasedTours(
  mapX: number,
  mapY: number,
  radius: number = 1000,
  contentTypeId: string = '12',
  numOfRows: number = 10
): Promise<TourItem[]> {
  try {
    const url = `${API_BASE_URL}/v1/tour/location-based?mapX=${mapX}&mapY=${mapY}&radius=${radius}&contentTypeId=${contentTypeId}&numOfRows=${numOfRows}`;
    const result: TourApiResponse<TourItem> = await cachedTourApiFetch(url);
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch location based tours:', error);
    return [];
  }
}

/**
 * 관광지 상세정보 조회
 */
export async function getTourDetail(contentId: string): Promise<any> {
  try {
    const url = `${API_BASE_URL}/v1/tour/detail/${contentId}`;
    const result = await cachedTourApiFetch(url);
    return result.data;
  } catch (error) {
    console.error('Failed to fetch tour detail:', error);
    return null;
  }
}

/**
 * 관광지 이미지 조회
 */
export async function getTourImages(contentId: string): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}/v1/tour/images/${contentId}`;
    const result = await cachedTourApiFetch(url);
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch tour images:', error);
    return [];
  }
}

/**
 * 맛집 검색
 */
export async function getRestaurants(
  mapX: number,
  mapY: number,
  radius: number = 2000,
  numOfRows: number = 10,
  pageNo: number = 1,
  lang?: string
): Promise<TourItem[]> {
  try {
    const url = `${API_BASE_URL}/v1/tour/restaurants?mapX=${mapX}&mapY=${mapY}&radius=${radius}&numOfRows=${numOfRows}&pageNo=${pageNo}${lang ? `&lang=${lang}` : ''}`;
    const result: TourApiResponse<TourItem> = await cachedTourApiFetch(url);
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch restaurants:', error);
    return [];
  }
}

/**
 * 숙소 검색
 */
export async function getAccommodations(
  mapX: number,
  mapY: number,
  radius: number = 2000,
  numOfRows: number = 10,
  pageNo: number = 1,
  lang?: string
): Promise<TourItem[]> {
  try {
    const url = `${API_BASE_URL}/v1/tour/accommodations?mapX=${mapX}&mapY=${mapY}&radius=${radius}&numOfRows=${numOfRows}&pageNo=${pageNo}${lang ? `&lang=${lang}` : ''}`;
    const result: TourApiResponse<TourItem> = await cachedTourApiFetch(url);
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch accommodations:', error);
    return [];
  }
}

/**
 * 카페 검색
 */
export async function getCafes(
  mapX: number,
  mapY: number,
  radius: number = 2000,
  numOfRows: number = 10
): Promise<TourItem[]> {
  try {
    const url = `${API_BASE_URL}/v1/tour/cafes?mapX=${mapX}&mapY=${mapY}&radius=${radius}&numOfRows=${numOfRows}`;
    const result: TourApiResponse<TourItem> = await cachedTourApiFetch(url);
    return result.data || [];
  } catch (error) {
    console.error('Failed to fetch cafes:', error);
    return [];
  }
}
