import { Link } from "react-router-dom";
import { photoUrl } from "../../lib/fetchers";

type Item = {
  id: string;
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  photos?: { name: string }[];
};

export default function PlaceGrid({ items }: { items: Item[] }) {
  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => {
          const src = photoUrl(p.id, p.photos?.[0]?.name, 1000);
          return (
            <div key={p.id} className="card bg-base-100 shadow-xl">
              <figure className="w-full aspect-[4/3] overflow-hidden">
                {src ? <img src={src} alt={p.displayName?.text || "place"} className="w-full h-full object-cover" loading="lazy" />
                     : <div className="w-full h-full bg-base-200 flex items-center justify-center">이미지 없음</div>}
              </figure>
              <div className="card-body">
                <h3 className="card-title">{p.displayName?.text || "이름 없음"}</h3>
                <p className="text-sm opacity-80">⭐ {p.rating ?? "-"} ({p.userRatingCount ?? 0})</p>
                <div className="card-actions justify-end">
                  <Link to={`/places/${encodeURIComponent(p.id)}`} className="btn btn-outline btn-sm">자세히</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
