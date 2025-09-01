import { useEffect, useRef, useState } from "react";
import { searchPlaces, photoUrl } from "../../lib/fetchers";

type Slide = { key: string; title: string; sub: string; bg?: string };

const THEMES = [
  { key: "자연",  title: "자연으로의 초대", sub: "산·바다·섬을 한 번에" },
  { key: "도심",  title: "도심 속 힐링 스팟", sub: "가까운 곳부터 가볍게" },
  { key: "역사",  title: "시간여행",       sub: "역사 속으로" },
  { key: "축제",  title: "축제의 계절",     sub: "지금 즐기기 좋은" },
];

// 기본 배경 이미지 URL들 (API 호출 실패 시 사용)
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&h=900&fit=crop", // 자연
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&h=900&fit=crop", // 도심
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1600&h=900&fit=crop", // 역사
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&h=900&fit=crop", // 축제
];

export default function Hero() {
  const [slides, setSlides] = useState<Slide[]>(THEMES.map((theme, idx) => ({
    ...theme,
    bg: FALLBACK_IMAGES[idx] // 초기 상태에서도 fallback 이미지 설정
  })));
  const [i, setI] = useState(0);
  const timer = useRef<number | null>(null);
  const hasLoaded = useRef<boolean>(false);
  const isMounted = useRef<boolean>(true);

  useEffect(() => {
    // 이미 로드된 경우 중복 실행 방지
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    
    (async () => {
      // fetch one photo per theme to use as background
      const withBg: Slide[] = [];
      for (let idx = 0; idx < THEMES.length; idx++) {
        const t = THEMES[idx];
        if (!isMounted.current) break; // 컴포넌트가 언마운트되면 중단
        
        try {
          // API 호출 제한: 한 번에 하나씩만 호출
          const list = await searchPlaces({ 
            theme: t.key, 
            onlyTourism: true, 
            sort: "score", 
            limit: 1 
          });
          
          if (!isMounted.current) break;
          
          const p = list[0];
          let bg: string | undefined;
          
          if (p?.id && p?.photos?.[0]?.name) {
            bg = photoUrl(p.id, p.photos[0].name, 1600) || undefined;
          }
          
          // API에서 이미지를 가져오지 못한 경우 fallback 이미지 사용
          if (!bg) {
            bg = FALLBACK_IMAGES[idx];
          }
          
          withBg.push({ ...t, bg });
        } catch (error) {
          // API 호출 실패 시 fallback 이미지 사용
          if (isMounted.current) {
            withBg.push({ ...t, bg: FALLBACK_IMAGES[idx] });
          }
        }
      }
      
      if (isMounted.current && withBg.length > 0) {
        setSlides(withBg);
      }
    })();
    
    return () => {
      isMounted.current = false;
    };
  }, []); // 빈 의존성 배열로 한 번만 실행

  function go(n: number) {
    setI((prev) => (prev + n + slides.length) % slides.length);
    resetTimer();
  }
  
  function jump(idx: number) {
    setI(idx);
    resetTimer();
  }
  
  function resetTimer() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => setI(v => (v + 1) % slides.length), 3500);
  }
  
  useEffect(() => { 
    resetTimer();
    return () => { 
      if (timer.current) window.clearInterval(timer.current); 
    }; 
  }, [slides.length]); // slides.length가 변경될 때만 재실행

  const s = slides[i];
  const style: any = s?.bg
    ? { 
        backgroundImage: `url(${s.bg})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }
    : { 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" 
      };

  return (
    <div className="w-full mb-8">
      <div className="relative w-[100vw] left-[50%] right-[50%] ml-[-50vw] mr-[-50vw] h-[42vh] md:h-[56vh]" style={style}>
        {/* arrows */}
        <button aria-label="prev" onClick={() => go(-1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm md:btn-md opacity-80">‹</button>
        <button aria-label="next" onClick={() => go(1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm md:btn-md opacity-80">›</button>

        {/* text overlay */}
        <div className="absolute bottom-6 left-6 text-white drop-shadow-lg">
          <h2 className="text-2xl md:text-4xl font-bold">{s?.title}</h2>
          <p className="text-sm md:text-base opacity-90">{s?.sub}</p>
        </div>

        {/* dots */}
        <div className="absolute right-4 bottom-4 flex gap-2">
          {slides.map((_, idx) => (
            <button key={idx} aria-label={`slide ${idx+1}`} onClick={() => jump(idx)}
              className={`w-2.5 h-2.5 rounded-full ${idx===i ? "bg-white" : "bg-white/50"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
