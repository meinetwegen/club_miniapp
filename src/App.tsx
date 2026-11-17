import { useEffect, useState } from "react";
import { api } from "./api";
import News from "./pages/News";
import Events from "./pages/Events";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import Team from "./pages/Team";

type Tab = "news" | "events" | "library" | "profile" | "team";

export default function App() {
  const [me, setMe] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("news");

  useEffect(() => {
    api("me").then(setMe).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="center">
        <p className="err">{error}</p>
        <p className="muted">Закройте и откройте приложение заново из чата с ботом.</p>
      </div>
    );
  }
  if (!me) return <div className="center muted">Загрузка…</div>;

  const staff = me.role === "mentor" || me.role === "president";
  const tabs: [Tab, string, string][] = [
    ["news", "📰", "Новости"],
    ["events", "📅", "События"],
    ["library", "📚", "Библиотека"],
    ["profile", "🏆", "Профиль"],
    ...(staff ? ([["team", "🛠", me.role === "mentor" ? "Ментор" : "Клуб"]] as [Tab, string, string][]) : []),
  ];

  return (
    <>
      <main className="page">
        {tab === "news" && <News />}
        {tab === "events" && <Events />}
        {tab === "library" && <Library />}
        {tab === "profile" && <Profile />}
        {tab === "team" && staff && <Team role={me.role} />}
      </main>
      <nav className="tabbar">
        {tabs.map(([id, icon, label]) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            <span className="ico">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
