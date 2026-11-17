import { createRoot } from "react-dom/client";
import App from "./App";
import { tg } from "./api";
import "./styles.css";

try {
  tg?.ready();
  tg?.expand();
} catch {
  /* вне Telegram */
}

createRoot(document.getElementById("root")!).render(<App />);
