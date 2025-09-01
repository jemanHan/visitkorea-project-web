import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import TopBar from "../components/layout/TopBar";
import Footer from "../components/layout/Footer";
import Hero from "../components/home/Hero";
import ThemeChips from "../components/home/ThemeChips";
import RegionGrid from "../components/home/RegionGrid";
import PlaceGrid from "../components/home/PlaceGrid";
import { searchPlaces, fetchRegions, PlaceLite } from "../lib/fetchers";

const MIN_RATING = Number(import.meta.env.VITE_MIN_RATING ?? 4.3);
const MIN_REVIEWS = Number(import.meta.env.VITE_MIN_REVIEWS ?? 50);

export default function Home() {
  const [regions, setRegions] = useState<string[]>([]);
  const [theme, setTheme] = useState<string>("전체");
  const [region, setRegion] = useState<string>("전체");
  const [items, setItems] = useState<PlaceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetchKey, setLastFetchKey] = useState<string>("");

  const location = useLocation();
  const urlQuery = useMemo(() => new URLSearchParams(location.search).get("q") ?? "", [location.search]);

  async function loadRecommended() {
    const effectiveTheme = theme === "전체" ? undefined : theme;
    const effectiveRegion = region === "전체" ? undefined : region;
    
    // 중복 요청 방지를 위한 키 생성
    const fetchKey = `${effectiveTheme}-${effectiveRegion}-${urlQuery}`;
    if (fetchKey === lastFetchKey) return;
    
    setLastFetchKey(fetchKey);
    setLoading(true);
    try {
      const data = await searchPlaces({
        q: urlQuery || undefined,
        theme: effectiveTheme,
        region: effectiveRegion,
        minRating: MIN_RATING,
        minReviews: MIN_REVIEWS,
        sort: "score",
        onlyTourism: true,
        limit: 18
      });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const list = await fetchRegions();
      // Ensure "전체" exists at index 0
      const uniq = ["전체", ...list.filter(x => x !== "전체")];
      setRegions(uniq);
      await loadRecommended(); // COLD START: show content immediately
    })();
  }, []);

  useEffect(() => { 
    void loadRecommended(); 
  }, [theme, region, urlQuery]);

  return (
    <>
      <TopBar />
      <main className="container mx-auto px-4 py-6">
        <Hero />
        <ThemeChips current={theme} onPick={setTheme} />
        <RegionGrid regions={regions} current={region} onPick={setRegion} />
        <h2 className="text-xl md:text-2xl font-bold mb-4">추천</h2>
        {loading
          ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 9 }).map((_,i)=><div key={i} className="card bg-base-100 h-60 animate-pulse" />)}</div>
          : <PlaceGrid items={items} />}
      </main>
      <Footer />
    </>
  );
}
