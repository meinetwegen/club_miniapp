import { useCallback, useEffect, useState } from "react";

export const tg: any = (window as any).Telegram?.WebApp;
const API = import.meta.env.VITE_API_URL as string;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = any>(path: string, body?: object): Promise<T> {
  const r = await fetch(`${API}/${path}`, {
    method: body ? "POST" : "GET",
    headers: { "x-init-data": tg?.initData ?? "", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, data.error ?? "Ошибка запроса");
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

export const openLink = (url: string) => (tg?.openLink ? tg.openLink(url) : window.open(url, "_blank"));

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtShort = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

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
