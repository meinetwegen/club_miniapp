import { useState } from "react";
import { api, confirmAsync, fmtDate, fmtShort, notify, toLocalInput, useApi, useBusy } from "../api";

// ---------- новости ----------
export function NewsAdmin() {
  const { data, reload } = useApi<any[]>("news");
  const { busy, run } = useBusy();
  const [f, setF] = useState({ title: "", body: "", notify: false });

  const create = () =>
    run(async () => {
      const r = await api<{ sent: number }>("news-create", f);
      if (f.notify) notify(`Новость опубликована. Рассылка: доставлено ${r.sent}.`);
      setF({ title: "", body: "", notify: false });
      reload();
    });

  const del = (n: any) =>
    run(async () => {
      if (!(await confirmAsync(`Удалить новость «${n.title}»?`))) return;
      await api("news-delete", { id: n.id });
      reload();
    });

  return (
    <>
      <div className="card form">
        <h3>Новая новость</h3>
        <input placeholder="Заголовок" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <textarea placeholder="Текст" rows={5} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        <label className="check">
          <input type="checkbox" checked={f.notify} onChange={(e) => setF({ ...f, notify: e.target.checked })} />
          <span>Разослать всем участникам в Telegram</span>
        </label>
        <button className="btn" disabled={busy} onClick={create}>Опубликовать</button>
      </div>
      {data?.map((n) => (
        <div className="card row" key={n.id}>
          <div>
            <h3>{n.title}</h3>
            <p className="small muted">{fmtShort(n.created_at)}</p>
          </div>
          <button className="link danger" disabled={busy} onClick={() => del(n)}>Удалить</button>
        </div>
      ))}
    </>
  );
}

// ---------- мероприятия: создание, правка, удаление ----------
const emptyEvent = {
  title: "", description: "", starts_at: "", duration_min: "120", location: "", capacity: "", price: "", mentor_id: "",
};

export function EventsAdmin() {
  const { data, reload } = useApi<any[]>("events");
  const users = useApi<any[]>("users");
  const { busy, run } = useBusy();
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const mentors = (users.data ?? []).filter((u) => u.role === "mentor" || u.role === "president");

  const del = (e: any) =>
    run(async () => {
      if (!(await confirmAsync(`Удалить «${e.title}»? Все записи на него тоже удалятся.`))) return;
      await api("event-delete", { id: e.id });
      reload();
    });

  return (
    <>
      <button className="btn" onClick={() => setEditing(editing === "new" ? null : "new")}>
        {editing === "new" ? "Закрыть" : "+ Новое мероприятие"}
      </button>
      {editing === "new" && (
        <EventForm mentors={mentors} onDone={() => { setEditing(null); reload(); }} />
      )}

      {data?.slice().reverse().map((e) => (
        <article className="card" key={e.id}>
          <h3>{e.title}</h3>
          <p className="meta">🕒 {fmtDate(e.starts_at)} · 👥 {e.registered}{e.capacity ? `/${e.capacity}` : ""}</p>
          <div className="actions">
            <button className="btn ghost" onClick={() => setEditing(editing === e.id ? null : e.id)}>
              {editing === e.id ? "Закрыть" : "Изменить"}
            </button>
            <button className="btn ghost danger" disabled={busy} onClick={() => del(e)}>Удалить</button>
          </div>
          {editing === e.id && (
            <EventForm mentors={mentors} initial={e} onDone={() => { setEditing(null); reload(); }} />
          )}
        </article>
      ))}
    </>
  );
}

function EventForm({ mentors, initial, onDone }: { mentors: any[]; initial?: any; onDone: () => void }) {
  const { busy, run } = useBusy();
  const [f, setF] = useState(
    initial
      ? {
          title: initial.title,
          description: initial.description ?? "",
          starts_at: toLocalInput(initial.starts_at),
          duration_min: String(initial.duration_min ?? 120),
          location: initial.location ?? "",
          capacity: initial.capacity != null ? String(initial.capacity) : "",
          price: initial.price != null ? String(initial.price) : "",
          mentor_id: initial.mentor_id ?? "",
        }
      : emptyEvent,
  );
  const set = (k: keyof typeof emptyEvent) => (e: any) => setF({ ...f, [k]: e.target.value });

  const save = () =>
    run(async () => {
      if (!f.title.trim() || !f.starts_at) return notify("Укажите название и дату");
      const payload = { ...f, starts_at: new Date(f.starts_at).toISOString() };
      await api(initial ? "event-update" : "event-create", initial ? { ...payload, id: initial.id } : payload);
      onDone();
    });

  return (
    <div className="card form">
      <input placeholder="Название" value={f.title} onChange={set("title")} />
      <textarea placeholder="Описание" rows={4} value={f.description} onChange={set("description")} />
      <label className="small muted">Дата и время начала</label>
      <input type="datetime-local" value={f.starts_at} onChange={set("starts_at")} />
      <input type="number" min="15" placeholder="Длительность, минут" value={f.duration_min} onChange={set("duration_min")} />
      <input placeholder="Место" value={f.location} onChange={set("location")} />
      <input type="number" min="1" placeholder="Лимит мест (пусто — без лимита)" value={f.capacity} onChange={set("capacity")} />
      <input type="number" min="0" placeholder="Цена, ₸ (пусто — бесплатно)" value={f.price} onChange={set("price")} />
      <label className="small muted">Ментор</label>
      <select value={f.mentor_id} onChange={set("mentor_id")}>
        <option value="">— не назначен —</option>
        {mentors.map((m) => (
          <option key={m.id} value={m.id}>{m.first_name ?? m.username ?? m.id}</option>
        ))}
      </select>
      <button className="btn" disabled={busy} onClick={save}>{initial ? "Сохранить" : "Создать"}</button>
    </div>
  );
}

// ---------- люди и роли ----------
export function PeopleAdmin() {
  const { data, error, reload } = useApi<any[]>("users");
  const me = useApi<any>("me");
  const { busy, run } = useBusy();
  const [q, setQ] = useState("");

  if (error) return <p className="err">{error}</p>;
  if (!data) return <p className="muted">Загрузка…</p>;

  const list = data.filter((u) => `${u.first_name ?? ""} ${u.username ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  const setRole = (u: any, role: string) =>
    run(async () => {
      await api("set-role", { user_id: u.id, role });
      reload();
    });

  return (
    <>
      <input className="search" placeholder="Поиск по имени или @нику" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="small muted">Всего участников: {data.length}. Человек появляется в списке после первого входа в приложение.</p>
      {list.map((u) => (
        <div className="card row" key={u.id}>
          <div>
            <h3>{u.first_name ?? "Без имени"}</h3>
            <p className="small muted">{u.username ? `@${u.username}` : "нет @ника"}</p>
          </div>
          <select value={u.role} disabled={busy || u.id === me.data?.id} onChange={(e) => setRole(u, e.target.value)}>
            <option value="member">Участник</option>
            <option value="mentor">Ментор</option>
            <option value="president">Президент</option>
          </select>
        </div>
      ))}
    </>
  );
}

// ---------- библиотека ----------
const KIND_LABEL: Record<string, string> = {
  schematic: "Схема", datasheet: "Даташит", recording: "Запись занятия", other: "Другое",
};

export function MaterialsAdmin() {
  const { data, reload } = useApi<any[]>("materials");
  const { busy, run } = useBusy();
  const [f, setF] = useState({ title: "", description: "", kind: "schematic", url: "" });

  const add = () =>
    run(async () => {
      await api("material-create", f);
      setF({ title: "", description: "", kind: "schematic", url: "" });
      reload();
    });

  const del = (m: any) =>
    run(async () => {
      if (!(await confirmAsync(`Удалить «${m.title}»?`))) return;
      await api("material-delete", { id: m.id });
      reload();
    });

  return (
    <>
      <div className="card form">
        <h3>Добавить материал</h3>
        <p className="small muted">Файл загрузите на Google Drive / YouTube / Яндекс.Диск и вставьте ссылку.</p>
        <input placeholder="Название" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
          {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input placeholder="Ссылка (https://…)" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} />
        <input placeholder="Короткое описание (по желанию)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <button className="btn" disabled={busy} onClick={add}>Добавить</button>
      </div>
      {data?.map((m) => (
        <div className="card row" key={m.id}>
          <div>
            <h3>{m.title}</h3>
            <p className="small muted">{KIND_LABEL[m.kind]}</p>
          </div>
          <button className="link danger" disabled={busy} onClick={() => del(m)}>Удалить</button>
        </div>
      ))}
    </>
  );
}
