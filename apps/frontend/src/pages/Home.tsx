import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import TopBar from "../components/layout/TopBar";
import Footer from "../components/layout/Footer";
import Hero from "../components/common/Hero";
import PlaceCard from "../components/cards/PlaceCard";
import RegionChipsEnhanced from "../components/home/RegionChipsEnhanced";
import PlaceGrid from "../components/home/PlaceGrid";
import { searchPlaces, PlaceLite } from "../lib/fetchers";
import { preloadStrategies, getCachedData } from "../lib/preloader";

const MIN_RATING = Number(import.meta.env.VITE_MIN_RATING ?? 3.0);
const MIN_REVIEWS = Number(import.meta.env.VITE_MIN_REVIEWS ?? 5);

export default function Home() {
  const { t } = useTranslation();
  const [region, setRegion] = useState<string>("전국");
  const [items, setItems] = useState<PlaceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const location = useLocation();
  const urlQuery = useMemo(() => new URLSearchParams(location.search).get("q") ?? "", [location.search]);

  // 디바운스 및 중복 요청 취소 처리
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadRecommended = async () => {
    // 캐시된 데이터 먼저 확인
    const cacheKey = `home_${region}_${urlQuery}_${i18n.language}`;
    const cachedData = getCachedData(cacheKey, 300000); // 5분 캐시
    
    if (cachedData) {
      setItems((cachedData as any).data || []);
      setPagination((cachedData as any).pagination || null);
      setLoading(false);
      return;
    }

    // 이전 디바운스 타이머 클리어
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    // 100ms 디바운스 (2.5배 단축)
    debounceRef.current = window.setTimeout(async () => {
      // 이전 요청 취소
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const lang = i18n.language.split('-')[0];
        const baseParams = {
          q: urlQuery || undefined,
          region: region === "전국" ? undefined : region,
          minRating: MIN_RATING,
          minReviews: MIN_REVIEWS,
          sort: "score",
          onlyTourism: true,
          page: currentPage,
          limit: 8,
          language: lang
        } as const;

        const result = await searchPlaces(baseParams);
        let list = ((result as any).data || []) as PlaceLite[];
        let pageInfo = (result as any).pagination;
        
        // 디버깅: 페이지 정보 확인
        console.log(`[${region}] Loading page ${currentPage}:`, {
          currentPage,
          totalPages: pageInfo?.totalPages,
          hasNext: pageInfo?.hasNext,
          totalItems: pageInfo?.totalItems,
          itemsInPage: list.length,
          apiCalls: 1 // 현재 페이지 1회 호출
        });

        // 언어 스크립트 기준 필터링 + 백필
        const hasKorean = (s: string) => /[\u3131-\u318F\uAC00-\uD7A3]/.test(s);
        const getName = (it: PlaceLite) => it.displayName?.text || '';
        const matches = (name: string) => {
          if (!name) return false;
          if (lang === 'en') return !hasKorean(name);
          if (lang === 'ko') return hasKorean(name);
          return true;
        };

        // Google API 정보가 있는지 확인하는 함수
        const hasGoogleApiData = (item: PlaceLite) => {
          // PlaceLite 타입에는 id 필드만 있음
          const hasId = !!(item.id && item.id.trim() !== '');
          
          // 디버깅: 첫 번째 아이템의 구조 확인
          if (list.length > 0 && list.indexOf(item) === 0) {
            console.log('[DEBUG] First item structure:', {
              id: item.id,
              displayName: item.displayName,
              keys: Object.keys(item)
            });
          }
          
          return hasId;
        };

        let filtered = list.filter(it => {
          const nameMatch = matches(getName(it));
          // 영어 환경에서는 기본적으로 이름 매칭만 확인
          // Google API 정보는 선택적 (모든 아이템이 id를 가지고 있어야 함)
          if (lang === 'en') {
            return nameMatch; // 일단 이름 매칭만 확인
          }
          return nameMatch;
        });

        // 디버깅: 필터링 결과 로그
        console.log(`[${region}] Initial filtering: ${list.length} -> ${filtered.length} (lang: ${lang})`);
        
        // 영어 환경에서 상세 디버깅
        if (lang === 'en') {
          const withGoogleApi = list.filter(it => hasGoogleApiData(it)).length;
          const koreanNames = list.filter(it => hasKorean(getName(it))).length;
          const englishNames = list.filter(it => !hasKorean(getName(it))).length;
          
          console.log(`[${region}] Items with Google API: ${withGoogleApi}/${list.length}`);
          console.log(`[${region}] Korean names: ${koreanNames}, English names: ${englishNames}`);
          
          // 첫 번째 아이템의 이름 확인
          if (list.length > 0) {
            console.log(`[${region}] First item name: "${getName(list[0])}" (hasKorean: ${hasKorean(getName(list[0]))})`);
          }
        }

        // 부족하면 다음 페이지에서 추가로 끌어오기 (단순화)
        let nextPage = (pageInfo?.currentPage || currentPage) + 1;
        const seen = new Set<string>(list.map(i => i.id));
        let totalConsumedPages = 1; // 현재 페이지 포함

        // 단순하게 1페이지만 추가로 가져오기
        if (filtered.length < 8 && pageInfo?.hasNext) {
          try {
            const extra = await searchPlaces({ ...baseParams, page: nextPage });
            const extraList = ((extra as any).data || []) as PlaceLite[];
            const extraPageInfo = (extra as any).pagination;
            
            totalConsumedPages += 1;
            
            for (const it of extraList) {
              if (!seen.has(it.id)) {
                seen.add(it.id);
                const nameMatch = matches(getName(it));
                if (nameMatch) {
                  filtered.push(it);
                }
              }
              if (filtered.length >= 8) break;
            }
            
            // 디버깅: 추가 페이지 결과
            console.log(`[${region}] Extra page ${nextPage}: ${extraList.length} items -> ${filtered.length} total`);
          } catch (error) {
            console.warn(`Failed to fetch page ${nextPage}:`, error);
          }
        }

        // 최종 결과 로그
        const totalApiCalls = totalConsumedPages;
        console.log(`[${region}] Final result: ${filtered.length} items from ${totalConsumedPages} pages (API calls: ${totalApiCalls})`);

        // 최종 세팅: 부족하면 원본 섞어서 최소 노출 보장
        if (filtered.length < 8) {
          const filler = list.filter(it => !filtered.includes(it)).slice(0, 8 - filtered.length);
          filtered = [...filtered, ...filler];
        }

        // 페이지네이션 정보: 원본 정보 그대로 유지 (단순화)
        const adjustedPageInfo = {
          ...pageInfo,
          currentPage: currentPage,
          // 원본 페이지 정보 그대로 사용
          totalPages: pageInfo?.totalPages || 1,
          hasNext: pageInfo?.hasNext || false,
          totalItems: pageInfo?.totalItems || filtered.length
        };

        setItems(filtered);
        setPagination(adjustedPageInfo);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.error(e);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  useEffect(() => {
    void loadRecommended();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
  }, [region, urlQuery, currentPage, i18n.language]);

  // 필터 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [region, urlQuery]);

  const handlePageChange = useCallback((page: number) => {
    // 단순하게 페이지 번호만 설정
    console.log(`[${region}] Page change requested: ${currentPage} -> ${page}`);
    setCurrentPage(page);
  }, [region, currentPage]);

  const handleRegionChange = useCallback((newRegion: string) => {
    setRegion(newRegion);
  }, []);

  return (
    <>
      <TopBar />
      {/* Hero 배너 - 네비게이션과 겹치도록 */}
      <Hero 
        title={t('nationwideTitle')}
        subtitle={t('nationwideSubtitle')}
        imageUrl="/hero-banner.jpg"
      />
      
      {/* 메인 콘텐츠 */}
      <main className="section dark:bg-gray-900">
        <div className="container-xl">
          <RegionChipsEnhanced current={region} onPick={handleRegionChange} />
          
          {/* 인기 여행지 섹션 */}
          <div className="mb-6">
            <h2 className="section-title">{t('popularDestinations')}</h2>
            <p className="section-sub">{t('nationwideDescription')}</p>
          </div>
        {loading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">{Array.from({ length: 8 }).map((_,i)=><div key={i} className="card h-48 animate-pulse" />)}</div>
          : (
            <>
              <PlaceGrid items={items} />
              
              {/* 페이지네이션 */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 mt-12">
                  <button 
                    className={`px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200 ${
                      !pagination.hasPrev 
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                    disabled={!pagination.hasPrev}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    {t('previous')}
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const startPage = Math.max(1, currentPage - 2);
                      const pageNum = startPage + i;
                      if (pageNum > pagination.totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          className={`px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200 ${
                            currentPage === pageNum 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button 
                    className={`px-3 py-2 text-sm font-medium rounded-md border transition-all duration-200 ${
                      !pagination.hasNext 
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                    disabled={!pagination.hasNext}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    {t('next')}
                  </button>
                  
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      
      <Footer />
    </>
  );
}