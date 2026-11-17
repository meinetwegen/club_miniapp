import { fmtShort, useApi } from "../api";

export default function News() {
  const { data, error } = useApi<any[]>("news");
  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="muted">Загрузка…</p>;

  return (
    <>
      <h1>Новости клуба</h1>
      {data.length === 0 && <p className="muted">Пока новостей нет. Загляните позже!</p>}
      {data.map((n) => (
        <article className="card" key={n.id}>
          <h3>{n.title}</h3>
          <p className="small muted">{fmtShort(n.created_at)}</p>
          <p className="pre">{n.body}</p>
        </article>
      ))}
    </>
  );
}
