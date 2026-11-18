import { useCallback, useEffect, useState } from "react";

export const tg: any = (window as any).Telegram?.WebApp;
const API = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = any>(path: string, body?: object): Promise<T> {
  if (!API) throw new ApiError(0, "Не задан адрес сервера (VITE_API_URL). Пересоберите сайт.");
  let r: Response;
  try {
    r = await fetch(`${API}/${path}`, {
      method: body ? "POST" : "GET",
      headers: { "x-init-data": tg?.initData ?? "", "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Нет связи с сервером. Проверьте интернет.");
  }
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(r.status, data?.error ?? "Ошибка запроса");
  if (data === null) throw new ApiError(r.status, "Сервер ответил не так, как ожидалось. Проверьте VITE_API_URL.");
  return data as T;
}

/** Загрузка данных с эндпоинта + функция перезагрузки */
export function useApi<T = any>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [path]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, reload: load };
}

/** Выполнение действия с индикатором и показом ошибки */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      haptic("error");
      notify(e.message ?? "Ошибка");
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

export const notify = (msg: string) => {
  try {
    tg?.showAlert ? tg.showAlert(msg) : alert(msg);
  } catch {
    alert(msg);
  }
};

export const confirmAsync = (msg: string) =>
  new Promise<boolean>((resolve) => {
    try {
      tg?.showConfirm ? tg.showConfirm(msg, resolve) : resolve(confirm(msg));
    } catch {
      resolve(confirm(msg));
    }
  });

/** Лёгкая вибрация-отклик (только внутри Telegram) */
export const haptic = (kind: "success" | "error" | "light" = "light") => {
  try {
    if (kind === "light") tg?.HapticFeedback?.impactOccurred("light");
    else tg?.HapticFeedback?.notificationOccurred(kind);
  } catch {
    /* вне Telegram */
  }
};

export const openLink = (url: string) => (tg?.openLink ? tg.openLink(url) : window.open(url, "_blank"));

// ---------- даты ----------
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** «Ср, 20 ноября» */
export const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const wd = cap(d.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", ""));
  return `${wd}, ${d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`;
};

/** «18:00–20:00» */
export const timeRange = (iso: string, minutes = 120) => {
  const t = (d: Date) => d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const s = new Date(iso);
  return `${t(s)}–${t(new Date(s.getTime() + minutes * 60000))}`;
};

/** «Сегодня» / «Завтра» / null */
export const relDay = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(d) - start(now)) / 864e5);
  return diff === 0 ? "Сегодня" : diff === 1 ? "Завтра" : null;
};

export const isFresh = (iso: string, days = 3) => Date.now() - new Date(iso).getTime() < days * 864e5;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** «18 ноября», а для прошлых лет «18 ноября 2025» */
export const fmtShort = (iso: string) => {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", ...(sameYear ? {} : { year: "numeric" }) });
};

/** Склонение: plural(1, "отзыв", "отзыва", "отзывов") */
export const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

/** ISO → значение для <input type="datetime-local"> */
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const money = (n: number | null) => (n ? `${n.toLocaleString("ru-RU")} ₸` : "Бесплатно");

export const ROLE_LABEL: Record<string, string> = {
  member: "Участник",
  mentor: "Ментор",
  president: "Президент клуба",
};
