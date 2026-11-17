import { useState } from "react";
import { api, confirmAsync, fmtDate, money, notify, useApi, useBusy } from "../api";

export default function Events() {
  const { data, error, reload } = useApi<any[]>("events");
  const [past, setPast] = useState(false);

  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="muted">Загрузка…</p>;

  const now = Date.now();
  const list = data.filter((e) => (new Date(e.starts_at).getTime() < now) === past);
  if (past) list.reverse();

  return (
    <>
      <h1>Мероприятия</h1>
      <div className="seg">
        <button className={!past ? "on" : ""} onClick={() => setPast(false)}>Предстоящие</button>
        <button className={past ? "on" : ""} onClick={() => setPast(true)}>Прошедшие</button>
      </div>
      {list.length === 0 && (
        <p className="muted">{past ? "Здесь появятся прошедшие мероприятия." : "Пока нет запланированных мероприятий."}</p>
      )}
      {list.map((e) => (
        <EventCard key={e.id} e={e} past={past} onChange={reload} />
      ))}
    </>
  );
}

function EventCard({ e, past, onChange }: { e: any; past: boolean; onChange: () => void }) {
  const { busy, run } = useBusy();
  const [open, setOpen] = useState(false);
  const full = e.capacity != null && e.registered >= e.capacity;

  const register = () =>
    run(async () => {
      const r = await api<{ status: string }>("register", { event_id: e.id });
      if (r.status === "waitlist") notify("Мест нет — вы в листе ожидания. Мы напишем в Telegram, если место освободится.");
      onChange();
    });

  const cancel = () =>
    run(async () => {
      const msg = e.my_status === "waitlist" ? "Выйти из листа ожидания?" : "Отменить запись?";
      if (!(await confirmAsync(msg))) return;
      await api("cancel", { event_id: e.id });
      onChange();
    });

  return (
    <article className="card">
      <h3>{e.title}</h3>
      <p className="meta">🕒 {fmtDate(e.starts_at)}</p>
      {e.location && <p className="meta">📍 {e.location}</p>}
      {e.mentor?.first_name && <p className="meta">👤 Ментор: {e.mentor.first_name}</p>}
      <p className="meta">
        💰 {money(e.price)} · 👥 {e.capacity != null ? `${Math.min(e.registered, e.capacity)}/${e.capacity}` : e.registered}
        {e.waitlist > 0 && ` · ожидают: ${e.waitlist}`}
      </p>

      {e.description && (
        <>
          <p className={open ? "pre" : "pre clamp"}>{e.description}</p>
          <button className="link" onClick={() => setOpen(!open)}>{open ? "Свернуть" : "Подробнее"}</button>
        </>
      )}

      <div className="actions">
        {!past && e.my_status === null && (
          <button className="btn" disabled={busy} onClick={register}>
            {full ? "Встать в лист ожидания" : "Записаться"}
          </button>
        )}
        {!past && e.my_status === "registered" && (
          <>
            <span className="badge ok">✓ Вы записаны</span>
            <button className="btn ghost" disabled={busy} onClick={cancel}>Отменить запись</button>
          </>
        )}
        {!past && e.my_status === "waitlist" && (
          <>
            <span className="badge wait">⏳ В очереди: №{e.my_position}</span>
            <button className="btn ghost" disabled={busy} onClick={cancel}>Выйти из очереди</button>
          </>
        )}
        {past && e.my_status === "registered" && <Feedback e={e} onDone={onChange} />}
      </div>
    </article>
  );
}

function Feedback({ e, onDone }: { e: any; onDone: () => void }) {
  const { busy, run } = useBusy();
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (e.feedback_left) return <span className="badge ok">Спасибо за отзыв ✓</span>;
  if (!show) return <button className="btn ghost" onClick={() => setShow(true)}>Оставить отзыв (необязательно)</button>;

  const send = () =>
    run(async () => {
      if (!rating) return notify("Поставьте оценку");
      await api("feedback", { event_id: e.id, rating, comment });
      onDone();
    });

  return (
    <div className="feedback">
      <div className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={n <= rating ? "on" : ""} onClick={() => setRating(n)} aria-label={`${n}`}>★</button>
        ))}
      </div>
      <textarea
        placeholder="Что понравилось, что улучшить? (по желанию)"
        value={comment}
        maxLength={1000}
        onChange={(ev) => setComment(ev.target.value)}
      />
      <p className="small muted">Отзыв анонимный — менторы видят оценку и текст, но не имя.</p>
      <button className="btn" disabled={busy} onClick={send}>Отправить</button>
    </div>
  );
}
