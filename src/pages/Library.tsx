import { openLink, useApi } from "../api";
import { Empty, ErrorBox, Icon, Loading, type IconName } from "../ui";

const KINDS: [string, string, IconName][] = [
  ["schematic", "Схемы", "circuit"],
  ["datasheet", "Даташиты", "doc"],
  ["recording", "Записи занятий", "play"],
  ["other", "Другое", "clip"],
];

export default function Library() {
  const { data, error, reload } = useApi<any[]>("materials");
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  return (
    <>
      <h1>Библиотека</h1>
      {data.length === 0 && (
        <Empty title="Материалы скоро появятся" text="Схемы, даташиты и записи занятий будут собраны здесь." />
      )}
      {KINDS.map(([kind, title, icon]) => {
        const items = data.filter((m) => m.kind === kind);
        if (!items.length) return null;
        return (
          <section key={kind}>
            <h2>{title}</h2>
            {items.map((m) => (
              <button className="card row link-row" key={m.id} onClick={() => openLink(m.url)}>
                <span className="ico"><Icon name={icon} size={22} /></span>
                <span className="grow">
                  <h3>{m.title}</h3>
                  {m.description && <p className="small muted">{m.description}</p>}
                </span>
                <Icon name="chevron" size={20} className="chev" />
              </button>
            ))}
          </section>
        );
      })}
    </>
  );
}
