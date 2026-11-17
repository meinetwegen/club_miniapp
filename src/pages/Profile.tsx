import { ROLE_LABEL, fmtShort, useApi } from "../api";

export default function Profile() {
  const { data, error } = useApi<any>("profile");
  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="muted">Загрузка…</p>;

  const { me, attended, signups, achievements } = data;
  const earned = achievements.filter((a: any) => a.earned_at).length;

  return (
    <>
      <div className="card hero">
        <div className="avatar">{(me.first_name ?? "?").slice(0, 1).toUpperCase()}</div>
        <div>
          <h2 style={{ margin: 0 }}>{me.first_name ?? "Участник"}</h2>
          <p className="muted small">
            {me.username ? `@${me.username} · ` : ""}
            {ROLE_LABEL[me.role]}
          </p>
        </div>
      </div>

      <div className="stats">
        <div className="card"><b>{attended}</b><span>посещено</span></div>
        <div className="card"><b>{signups}</b><span>записей</span></div>
        <div className="card"><b>{earned}/{achievements.length}</b><span>достижений</span></div>
      </div>

      <h2>Достижения</h2>
      <div className="grid">
        {achievements.map((a: any) => (
          <div className={`card ach ${a.earned_at ? "" : "locked"}`} key={a.code}>
            <div className="big">{a.icon}</div>
            <h3>{a.title}</h3>
            <p className="small muted">{a.description}</p>
            {a.earned_at && <p className="small ok-text">Получено {fmtShort(a.earned_at)}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
