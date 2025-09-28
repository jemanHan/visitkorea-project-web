import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import TopBar from "../components/layout/TopBar";
import Footer from "../components/layout/Footer";
import Hero from "../components/common/Hero";
import PlaceCard from "../components/cards/PlaceCard";
import RegionChips from "../components/home/RegionChips";
import PlaceGrid from "../components/home/PlaceGrid";
import { searchPlaces, PlaceLite } from "../lib/fetchers";

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

  const loadRecommended = useCallback(async () => {
    // 이전 디바운스 타이머 클리어
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    // 250ms 디바운스
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

        // 언어 스크립트 기준 필터링 + 백필
        const hasKorean = (s: string) => /[\u3131-\u318F\uAC00-\uD7A3]/.test(s);
        const getName = (it: PlaceLite) => it.displayName?.text || '';
        const matches = (name: string) => {
          if (!name) return false;
          if (lang === 'en') return !hasKorean(name);
          if (lang === 'ko') return hasKorean(name);
          return true;
        };

        let filtered = list.filter(it => matches(getName(it)));

        // 부족하면 다음 페이지에서 추가로 끌어오기 (최대 2페이지 추가)
        let nextPage = (pageInfo?.currentPage || currentPage) + 1;
        const maxExtraPages = 2;
        let extraTried = 0;
        const seen = new Set<string>(list.map(i => i.id));
        let totalConsumedPages = 1; // 현재 페이지 포함

        while (filtered.length < 8 && pageInfo?.hasNext && extraTried < maxExtraPages) {
          const extra = await searchPlaces({ ...baseParams, page: nextPage });
          const extraList = ((extra as any).data || []) as PlaceLite[];
          const extraPageInfo = (extra as any).pagination;
          nextPage += 1;
          extraTried += 1;
          totalConsumedPages += 1;
          
          for (const it of extraList) {
            if (!seen.has(it.id)) {
              seen.add(it.id);
              if (matches(getName(it))) filtered.push(it);
            }
            if (filtered.length >= 8) break;
          }
        }

        // 최종 세팅: 부족하면 원본 섞어서 최소 노출 보장
        if (filtered.length < 8) {
          const filler = list.filter(it => !filtered.includes(it)).slice(0, 8 - filtered.length);
          filtered = [...filtered, ...filler];
        }

        // 페이지네이션 정보 조정: 소비된 페이지 수만큼 조정
        const adjustedPageInfo = {
          ...pageInfo,
          currentPage: currentPage,
          totalPages: Math.max(1, (pageInfo?.totalPages || 1) - (totalConsumedPages - 1)),
          hasNext: (pageInfo?.totalPages || 1) > currentPage + (totalConsumedPages - 1),
          totalItems: Math.max(filtered.length, pageInfo?.totalItems || 0)
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
  }, [region, urlQuery, currentPage, i18n.language]);

  useEffect(() => {
    void loadRecommended();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
  }, [loadRecommended]);

  // 필터 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [region, urlQuery]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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
          <RegionChips current={region} onPick={handleRegionChange} />
          
          {/* 인기 여행지 섹션 */}
          <div className="mb-6">
            <div className="proof-accent-bar"></div>
            <h2 className="section-title mt-3">{t('popularDestinations')}</h2>
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
                  
                  <div className="text-sm text-gray-500 dark:text-white ml-4">
                    {pagination.totalItems}{t('items')} {t('of')} {((currentPage - 1) * 8) + 1}-{Math.min(currentPage * 8, pagination.totalItems)}{t('items')}
                  </div>
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