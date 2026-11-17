import { openLink, useApi } from "../api";

const KINDS: [string, string][] = [
  ["schematic", "📐 Схемы"],
  ["datasheet", "📄 Даташиты"],
  ["recording", "🎥 Записи занятий"],
  ["other", "📎 Другое"],
];

export default function Library() {
  const { data, error } = useApi<any[]>("materials");
  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="muted">Загрузка…</p>;

  return (
    <>
      <h1>Библиотека</h1>
      {data.length === 0 && (
        <div className="card">
          <h3>Скоро здесь появятся материалы</h3>
          <p className="muted">Схемы, даташиты и записи занятий — всё в одном месте.</p>
        </div>
      )}
      {KINDS.map(([kind, title]) => {
        const items = data.filter((m) => m.kind === kind);
        if (!items.length) return null;
        return (
          <section key={kind}>
            <h2>{title}</h2>
            {items.map((m) => (
              <button className="card row" key={m.id} onClick={() => openLink(m.url)}>
                <div>
                  <h3>{m.title}</h3>
                  {m.description && <p className="small muted">{m.description}</p>}
                </div>
                <span className="chev">›</span>
              </button>
            ))}
          </section>
        );
      })}
    </>
  );
}
