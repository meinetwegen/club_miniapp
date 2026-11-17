import { useState } from "react";
import { api, confirmAsync, fmtDate, notify, useApi, useBusy } from "../api";
import { EventsAdmin, MaterialsAdmin, NewsAdmin, PeopleAdmin } from "./Admin";

type Sub = "events" | "stock" | "news" | "manage" | "people" | "materials";

export default function Team({ role }: { role: "mentor" | "president" }) {
  const boss = role === "president";
  const [sub, setSub] = useState<Sub>("events");

  const subs: [Sub, string][] = [
    ["events", boss ? "Все события" : "Мои события"],
    ["stock", "Склад"],
    ...(boss
      ? ([["manage", "Создать/править"], ["news", "Новости"], ["people", "Люди"], ["materials", "Материалы"]] as [Sub, string][])
      : []),
  ];

  return (
    <>
      <h1>{boss ? "Управление клубом" : "Кабинет ментора"}</h1>
      <div className="chips">
        {subs.map(([id, label]) => (
          <button key={id} className={sub === id ? "on" : ""} onClick={() => setSub(id)}>{label}</button>
        ))}
      </div>
      {sub === "events" && <MyEvents />}
      {sub === "stock" && <Inventory boss={boss} />}
      {sub === "manage" && boss && <EventsAdmin />}
      {sub === "news" && boss && <NewsAdmin />}
      {sub === "people" && boss && <PeopleAdmin />}
      {sub === "materials" && boss && <MaterialsAdmin />}
    </>
  );
}

// ---------- события: списки участников, посещаемость, отзывы ----------
function MyEvents() {
  const { data, error, reload } = useApi<any[]>("my-events");
  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="muted">Загрузка…</p>;
  if (!data.length) return <p className="muted">Пока нет мероприятий.</p>;
  return <>{data.map((e) => <TeamEvent key={e.id} e={e} reload={reload} />)}</>;
}

function TeamEvent({ e, reload }: { e: any; reload: () => void }) {
  const [open, setOpen] = useState(false);
  const { run } = useBusy();
  const going = e.registrations.filter((r: any) => r.status === "registered");
  const wait = e.registrations.filter((r: any) => r.status === "waitlist");
  const came = going.filter((r: any) => r.attended).length;

  const mark = (r: any, attended: boolean) =>
    run(async () => {
      await api("attendance", { registration_id: r.id, attended });
      reload();
    });

  const name = (r: any) => `${r.user?.first_name ?? "—"}${r.user?.username ? " (@" + r.user.username + ")" : ""}`;

  return (
    <article className="card">
      <h3>{e.title}</h3>
      <p className="meta">🕒 {fmtDate(e.starts_at)}</p>
      <p className="meta">
        👥 {going.length}{e.capacity ? `/${e.capacity}` : ""} записано · ✅ {came} пришли
        {wait.length > 0 && ` · ⏳ ${wait.length} в очереди`}
      </p>
      {e.avg_rating != null && (
        <p className="meta">⭐ {e.avg_rating.toFixed(1)} ({e.feedback.length} отзывов)</p>
      )}
      <button className="link" onClick={() => setOpen(!open)}>{open ? "Скрыть" : "Участники и отзывы"}</button>

      {open && (
        <>
          <h4>Записались</h4>
          {going.length === 0 && <p className="muted small">Никого.</p>}
          {going.map((r: any) => (
            <label className="check" key={r.id}>
              <input type="checkbox" checked={r.attended} onChange={(ev) => mark(r, ev.target.checked)} />
              <span>{name(r)}</span>
            </label>
          ))}
          {wait.length > 0 && (
            <>
              <h4>Лист ожидания</h4>
              {wait.map((r: any, i: number) => (
                <p className="small" key={r.id}>{i + 1}. {name(r)}</p>
              ))}
            </>
          )}
          <h4>Отзывы</h4>
          {e.feedback.length === 0 && <p className="muted small">Пока нет.</p>}
          {e.feedback.map((f: any, i: number) => (
            <p className="small" key={i}>
              {"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)} {f.comment}
            </p>
          ))}
        </>
      )}
    </article>
  );
}

// ---------- склад: компоненты и инструменты ----------
function Inventory({ boss }: { boss: boolean }) {
  const { data, error, reload } = useApi<any[]>("inventory");
  const { busy, run } = useBusy();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", category: "", quantity: "1", note: "" });

  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="muted">Загрузка…</p>;

  const add = () =>
    run(async () => {
      await api("inventory-add", f);
      setF({ name: "", category: "", quantity: "1", note: "" });
      setAdding(false);
      reload();
    });

  return (
    <>
      <button className="btn ghost" onClick={() => setAdding(!adding)}>{adding ? "Закрыть" : "+ Добавить предмет"}</button>
      {adding && (
        <div className="card form">
          <input placeholder="Название (например, Arduino Uno)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input placeholder="Категория (платы, инструменты…)" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <input type="number" min="0" placeholder="Количество" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
          <input placeholder="Заметка" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <button className="btn" disabled={busy} onClick={add}>Сохранить</button>
        </div>
      )}
      {data.length === 0 && <p className="muted">Склад пока пуст.</p>}
      {data.map((i) => (
        <Item key={i.id} i={i} boss={boss} reload={reload} />
      ))}
    </>
  );
}

function Item({ i, boss, reload }: { i: any; boss: boolean; reload: () => void }) {
  const { busy, run } = useBusy();
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ borrower: "", qty: "1", due_at: "" });

  const loan = () =>
    run(async () => {
      await api("inventory-loan", {
        item_id: i.id,
        borrower: f.borrower,
        qty: f.qty,
        due_at: f.due_at ? new Date(f.due_at).toISOString() : null,
      });
      setF({ borrower: "", qty: "1", due_at: "" });
      setShow(false);
      reload();
    });

  const back = (l: any) =>
    run(async () => {
      await api("inventory-return", { loan_id: l.id });
      reload();
    });

  const del = () =>
    run(async () => {
      if (!(await confirmAsync(`Удалить «${i.name}» со склада?`))) return;
      await api("inventory-delete", { id: i.id });
      reload();
    });

  return (
    <article className="card">
      <h3>{i.name}</h3>
      <p className="meta">
        {i.category && `${i.category} · `}в наличии {i.available} из {i.quantity}
      </p>
      {i.note && <p className="small muted">{i.note}</p>}

      {i.loans.map((l: any) => {
        const late = l.due_at && new Date(l.due_at) < new Date();
        return (
          <div className="loan" key={l.id}>
            <span className={late ? "late" : ""}>
              {l.borrower} · {l.qty} шт.{l.due_at ? ` · до ${new Date(l.due_at).toLocaleDateString("ru-RU")}` : ""}
              {late ? " ⚠ просрочено" : ""}
            </span>
            <button className="link" disabled={busy} onClick={() => back(l)}>Вернули</button>
          </div>
        );
      })}

      <div className="actions">
        {i.available > 0 && <button className="btn ghost" onClick={() => setShow(!show)}>Выдать</button>}
        {boss && <button className="btn ghost danger" disabled={busy} onClick={del}>Удалить</button>}
      </div>

      {show && (
        <div className="form">
          <input placeholder="Кому выдано (имя)" value={f.borrower} onChange={(e) => setF({ ...f, borrower: e.target.value })} />
          <input type="number" min="1" max={i.available} placeholder="Сколько" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} />
          <label className="small muted">Вернуть до (по желанию)</label>
          <input type="date" value={f.due_at} onChange={(e) => setF({ ...f, due_at: e.target.value })} />
          <button className="btn" disabled={busy} onClick={() => (f.borrower.trim() ? loan() : notify("Укажите, кому выдаёте"))}>
            Выдать
          </button>
        </div>
      )}
    </article>
  );
}
