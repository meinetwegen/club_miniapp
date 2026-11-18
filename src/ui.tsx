import type { ReactNode } from "react";

// Линейные иконки в стиле логотипа: одинаковая толщина контура, скруглённые концы.
const P = {
  news: (<><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M9 8h6M9 12h6M9 16h3.5" /></>),
  calendar: (<><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 17.5h.01M12 17.5h.01" strokeWidth="2.4" /></>),
  book: (<path d="M12 6.7C10.3 5.4 8 4.8 4.5 4.8v12.9c3.5 0 5.8.6 7.5 1.8 1.7-1.2 4-1.8 7.5-1.8V4.8c-3.5 0-5.8.6-7.5 1.9zM12 6.7v12.8" />),
  sliders: (<><path d="M4 7h8M18 7h2M4 12h2M12 12h8M4 17h10M20 17h0" /><circle cx="15" cy="7" r="2.2" /><circle cx="9" cy="12" r="2.2" /><circle cx="17" cy="17" r="2.2" /></>),
  pin: (<><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>),
  user: (<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  check: (<path d="M5 12.5l4.5 4.5L19 7.5" />),
  chevron: (<path d="M9 5l7 7-7 7" />),
  circuit: (<path d="M3 12h4l2-5 4 10 2-5h6" />),
  doc: (<><path d="M6.5 3h7.5l4.5 4.5V20a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5 20V4.5A1.5 1.5 0 0 1 6.5 3z" /><path d="M14 3v4.5h4.5M8.5 13h7M8.5 17h5" /></>),
  play: (<><rect x="3" y="5" width="18" height="14" rx="3.5" /><path d="M10.5 9.5v5l4-2.5z" /></>),
  clip: (<path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7-7l8-8a3.3 3.3 0 0 1 4.7 4.7l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3" />),
  lock: (<><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>),
  star: (<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />),
} as const;

export type IconName = keyof typeof P;

export function Icon({ name, size = 22, strokeWidth = 1.8, className }: { name: IconName; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" className={className}>
      {P[name]}
    </svg>
  );
}

const base = import.meta.env.BASE_URL;

/** Голова кота-талисмана клуба */
export function Cat({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      className={`cat ${className}`}
      src={`${base}${size > 56 ? "cat-head.png" : "cat-head-sm.png"}`}
      width={Math.round(size * 0.956)}
      height={size}
      alt=""
      draggable={false}
    />
  );
}

export function Loading({ label = "Загружаем…" }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <Cat size={72} className="bob" />
      <p>{label}</p>
    </div>
  );
}

export function Empty({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="state">
      <div className="cat-badge"><Cat size={84} /></div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state" role="alert">
      <div className="cat-badge"><Cat size={84} /></div>
      <h2>Что-то пошло не так</h2>
      <p>{message}</p>
      {onRetry && <button className="btn" onClick={onRetry}>Попробовать снова</button>}
    </div>
  );
}
