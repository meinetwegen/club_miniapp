import { useCallback, useEffect, useState } from "react";
import { api, ROLE_LABEL } from "./api";
import { Cat, ErrorBox, Icon, Loading, type IconName } from "./ui";
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

  const load = useCallback(() => {
    setError(null);
    api("me").then(setMe).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) {
    return (
      <div className="screen">
        <ErrorBox message={error} onRetry={load} />
      </div>
    );
  }
  if (!me) {
    return (
      <div className="screen">
        <Loading />
      </div>
    );
  }

  const staff = me.role === "mentor" || me.role === "president";
  const tabs: { id: Tab; label: string; icon?: IconName }[] = [
    { id: "news", label: "Новости", icon: "news" },
    { id: "events", label: "События", icon: "calendar" },
    { id: "library", label: "Библиотека", icon: "book" },
    { id: "profile", label: "Профиль" },
    ...(staff ? [{ id: "team" as Tab, label: me.role === "mentor" ? "Ментор" : "Клуб", icon: "sliders" as IconName }] : []),
  ];

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="mark"><Cat size={30} /></span>
          <span><span className="brand-a">AITU</span> Electronics</span>
        </div>
        {staff && <span className="chip role">{ROLE_LABEL[me.role]}</span>}
      </header>

      <main className="page" key={tab}>
        {tab === "news" && <News />}
        {tab === "events" && <Events />}
        {tab === "library" && <Library />}
        {tab === "profile" && <Profile />}
        {tab === "team" && staff && <Team role={me.role} />}
      </main>

      <nav className="tabbar" aria-label="Разделы">
        {tabs.map((t) => (
          <button key={t.id} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
            {t.icon ? <Icon name={t.icon} size={24} strokeWidth={tab === t.id ? 2.2 : 1.8} /> : <Cat size={24} />}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
