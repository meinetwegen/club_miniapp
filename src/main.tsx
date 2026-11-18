import { createRoot } from "react-dom/client";
import "@fontsource-variable/onest";
import App from "./App";
import { tg } from "./api";
import "./styles.css";

// Тема: берём из Telegram, а вне Telegram — из системных настроек
const COLORS = { light: "#EEF3F8", dark: "#08121E" } as const;

function applyTheme() {
  const dark = tg?.colorScheme
    ? tg.colorScheme === "dark"
    : window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const scheme = dark ? "dark" : "light";
  document.documentElement.dataset.theme = scheme;
  try {
    tg?.setHeaderColor?.(COLORS[scheme]);
    tg?.setBackgroundColor?.(COLORS[scheme]);
    tg?.setBottomBarColor?.(dark ? "#102236" : "#FFFFFF");
  } catch {
    /* старые версии Telegram */
  }
}

try {
  tg?.ready();
  tg?.expand();
  tg?.disableVerticalSwipes?.(); // чтобы случайный свайп вниз не закрывал приложение
  tg?.onEvent?.("themeChanged", applyTheme);
} catch {
  /* вне Telegram */
}
applyTheme();

createRoot(document.getElementById("root")!).render(<App />);
