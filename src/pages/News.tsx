import { useState } from "react";
import { fmtShort, isFresh, useApi } from "../api";
import { Empty, ErrorBox, Loading } from "../ui";

export default function News() {
  const { data, error, reload } = useApi<any[]>("news");
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  return (
    <>
      <h1>Новости клуба</h1>
      {data.length === 0 ? (
        <Empty title="Пока тихо" text="Как только клуб опубликует новость, она появится здесь." />
      ) : (
        data.map((n) => <NewsCard key={n.id} n={n} />)
      )}
    </>
  );
}

function NewsCard({ n }: { n: any }) {
  const [open, setOpen] = useState(false);
  const long = n.body.length > 240 || n.body.split("\n").length > 5;

  return (
    <article className="card news">
      <p className="meta">
        {isFresh(n.created_at) && <span className="chip cyan">Новое</span>}
        <time dateTime={n.created_at}>{fmtShort(n.created_at)}</time>
      </p>
      <h3>{n.title}</h3>
      <p className={open || !long ? "pre" : "pre clamp"}>{n.body}</p>
      {long && (
        <button className="btn quiet" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? "Свернуть" : "Читать дальше"}
        </button>
      )}
    </article>
  );
}
