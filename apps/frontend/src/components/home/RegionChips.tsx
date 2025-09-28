import { memo } from "react";
import { useTranslation } from "react-i18next";

type Props = { onPick: (region: string) => void; current?: string };

const REGIONS = [
  "전국", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
];

export default memo(function RegionChips({ onPick, current="전국" }: Props) {
  const { t } = useTranslation();

  return (
    <section className="mb-6">
      <div className="grid grid-cols-9 gap-3 px-4 py-2">
        {REGIONS.map(region => {
          const active = (current || "전국") === region;
          return (
            <button
              key={region}
              onClick={() => onPick(region)}
              className={`px-4 py-2 rounded-full border-2 whitespace-nowrap transition-all duration-300 font-medium text-sm ${
                active 
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transform scale-105" 
                  : "bg-white dark:bg-slate-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 dark:hover:from-slate-600 dark:hover:to-slate-500 border-gray-200 dark:border-slate-500 hover:border-blue-400 dark:hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-200 hover:shadow-md hover:shadow-gray-200 dark:hover:shadow-slate-600 hover:transform hover:scale-105 text-gray-700 dark:text-slate-200"
              }`}
            >
              {t(`region.${region}`)}
            </button>
          );
        })}
      </div>
    </section>
  );
});
