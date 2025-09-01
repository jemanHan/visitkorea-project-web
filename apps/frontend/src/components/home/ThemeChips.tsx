type Props = { onPick: (q: string) => void; current?: string };
const THEMES = ["전체","자연","도심","역사","축제"];

export default function ThemeChips({ onPick, current="전체" }: Props) {
  return (
    <section className="mb-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {THEMES.map(t => {
          const active = (current || "전체") === t;
          return (
            <button
              key={t}
              onClick={() => onPick(t)}
              className={`px-3 py-1 rounded-full border whitespace-nowrap ${active ? "bg-black text-white" : "bg-white"}`}>
              {t}
            </button>
          );
        })}
      </div>
    </section>
  );
}
