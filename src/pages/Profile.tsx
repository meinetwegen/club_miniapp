import { ROLE_LABEL, fmtShort, useApi } from "../api";
import { Cat, ErrorBox, Icon, Loading } from "../ui";

export default function Profile() {
  const { data, error, reload } = useApi<any>("profile");
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const { me, attended, signups, achievements } = data;
  const earned = achievements.filter((a: any) => a.earned_at).length;

  return (
    <>
      <div className="hero">
        <span className="avatar"><Cat size={64} /></span>
        <div>
          <h1>{me.first_name ?? "Участник"}</h1>
          <p className="muted">{ROLE_LABEL[me.role]}</p>
          {me.username && <p className="muted small">@{me.username}</p>}
        </div>
      </div>

      <dl className="stats">
        <div><dd>{attended}</dd><dt>Посещено</dt></div>
        <div><dd>{signups}</dd><dt>Записей</dt></div>
        <div><dd>{earned}<small>/{achievements.length}</small></dd><dt>Достижений</dt></div>
      </dl>

      <h2>Достижения</h2>
      <ul className="grid">
        {achievements.map((a: any) => (
          <li className={`card ach ${a.earned_at ? "" : "locked"}`} key={a.code}>
            <span className="medal" aria-hidden="true">{a.earned_at ? a.icon : <Icon name="lock" size={24} />}</span>
            <h3>{a.title}</h3>
            <p className="small muted">{a.earned_at ? `Получено ${fmtShort(a.earned_at)}` : a.description}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
