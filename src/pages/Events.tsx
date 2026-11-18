import { useState } from "react";
import { api, confirmAsync, dayLabel, haptic, money, notify, relDay, timeRange, useApi, useBusy } from "../api";
import { Empty, ErrorBox, Icon, Loading } from "../ui";

export default function Events() {
  const { data, error, reload } = useApi<any[]>("events");
  const [past, setPast] = useState(false);

  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const now = Date.now();
  const list = data.filter((e) => (new Date(e.starts_at).getTime() < now) === past);
  if (past) list.reverse();

  return (
    <>
      <h1>Мероприятия</h1>
      <div className="seg" role="group" aria-label="Период">
        <button aria-pressed={!past} onClick={() => setPast(false)}>Предстоящие</button>
        <button aria-pressed={past} onClick={() => setPast(true)}>Прошедшие</button>
      </div>

      {list.length === 0 ? (
        past ? (
          <Empty title="Архив пуст" text="Прошедшие мероприятия появятся здесь." />
        ) : (
          <Empty title="Пока ничего не запланировано" text="Загляните позже: новые мастер-классы появляются здесь." />
        )
      ) : (
        <ol className="trace">
          {list.map((e, i) => (
            <EventStop key={e.id} e={e} past={past} first={i === 0} onChange={reload} />
          ))}
        </ol>
      )}
    </>
  );
}

function EventStop({ e, past, first, onChange }: { e: any; past: boolean; first: boolean; onChange: () => void }) {
  const { busy, run } = useBusy();
  const [open, setOpen] = useState(false);

  const full = e.capacity != null && e.registered >= e.capacity;
  const left = e.capacity != null ? Math.max(0, e.capacity - e.registered) : null;
  const pct = e.capacity ? Math.min(100, Math.round((e.registered / e.capacity) * 100)) : 0;
  const state = past ? "past" : e.my_status === "registered" ? "going" : e.my_status === "waitlist" ? "wait" : first ? "next" : "idle";
  const rel = past ? null : relDay(e.starts_at);

  const register = () =>
    run(async () => {
      const r = await api<{ status: string }>("register", { event_id: e.id });
      if (r.status === "waitlist") {
        haptic("light");
        notify("Мест нет, поэтому вы в очереди. Если место освободится, мы напишем вам в Telegram.");
      } else {
        haptic("success");
      }
      onChange();
    });

  const cancel = () =>
    run(async () => {
      const msg = e.my_status === "waitlist" ? "Выйти из очереди?" : "Отменить запись?";
      if (!(await confirmAsync(msg))) return;
      await api("cancel", { event_id: e.id });
      onChange();
    });

  return (
    <li className={`stop ${state}`}>
      <span className="pad" aria-hidden="true" />
      <article className="card event">
        <header className="when">
          <p>
            {rel && <span className="chip cyan">{rel}</span>}
            <time dateTime={e.starts_at}>{dayLabel(e.starts_at)}</time>
          </p>
          <p className="time">{timeRange(e.starts_at, e.duration_min)}</p>
        </header>

        <h3>{e.title}</h3>

        <ul className="facts">
          {e.location && <li><Icon name="pin" size={17} />{e.location}</li>}
          {e.mentor?.first_name && <li><Icon name="user" size={17} />Ведёт {e.mentor.first_name}</li>}
        </ul>

        <div className="seats">
          <span className={`chip ${e.price ? "" : "ok"}`}>{money(e.price)}</span>
          {past ? (
            <p>Записалось {e.registered}</p>
          ) : e.capacity != null ? (
            <>
              <div className="bar" role="img" aria-label={`Занято ${e.registered} из ${e.capacity} мест`}>
                <i className={full ? "full" : ""} style={{ width: `${pct}%` }} />
              </div>
              <p className={full || (left != null && left <= 3) ? "warn" : ""}>
                {full ? "Мест нет" : left! <= 3 ? `Осталось ${left}` : `Занято ${e.registered} из ${e.capacity}`}
                {e.waitlist > 0 && <span> · в очереди {e.waitlist}</span>}
              </p>
            </>
          ) : (
            <p>Записалось {e.registered}</p>
          )}
        </div>

        {e.description && (
          <>
            <p className={open ? "pre desc" : "pre desc clamp"}>{e.description}</p>
            <button className="btn quiet" aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? "Свернуть" : "Подробнее"}
            </button>
          </>
        )}

        {!past && e.my_status === null && (
          <button className="btn block" disabled={busy} onClick={register}>
            {full ? "Встать в очередь" : "Записаться"}
          </button>
        )}
        {!past && e.my_status === "registered" && (
          <div className="stack">
            <p className="status ok"><Icon name="check" size={18} strokeWidth={2.4} />Вы записаны</p>
            <button className="btn quiet" disabled={busy} onClick={cancel}>Отменить запись</button>
          </div>
        )}
        {!past && e.my_status === "waitlist" && (
          <div className="stack">
            <p className="status warn"><Icon name="clock" size={18} />Вы в очереди, номер {e.my_position}</p>
            <button className="btn quiet" disabled={busy} onClick={cancel}>Выйти из очереди</button>
          </div>
        )}
        {past && e.my_attended && <p className="status ok"><Icon name="check" size={18} strokeWidth={2.4} />Вы были на занятии</p>}
        {past && e.my_status === "registered" && <Feedback e={e} onDone={onChange} />}
      </article>
    </li>
  );
}

function Feedback({ e, onDone }: { e: any; onDone: () => void }) {
  const { busy, run } = useBusy();
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  if (e.feedback_left) return <p className="small muted thanks">Спасибо за отзыв!</p>;
  if (!show) return <button className="btn ghost block" onClick={() => setShow(true)}>Оставить отзыв</button>;

  const send = () =>
    run(async () => {
      if (!rating) return notify("Поставьте оценку от 1 до 5");
      await api("feedback", { event_id: e.id, rating, comment });
      haptic("success");
      onDone();
    });

  return (
    <div className="feedback">
      <p className="label">Как прошло занятие?</p>
      <div className="stars" role="group" aria-label="Оценка">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={n <= rating ? "on" : ""} aria-label={`${n} из 5`} aria-pressed={n === rating} onClick={() => setRating(n)}>
            <Icon name="star" size={30} strokeWidth={1.6} />
          </button>
        ))}
      </div>
      <textarea
        aria-label="Комментарий"
        placeholder="Что понравилось, что улучшить? Это необязательно."
        value={comment}
        maxLength={1000}
        rows={3}
        onChange={(ev) => setComment(ev.target.value)}
      />
      <p className="small muted">Отзыв анонимный: менторы видят оценку и текст, но не имя.</p>
      <button className="btn block" disabled={busy} onClick={send}>Отправить отзыв</button>
    </div>
  );
}
