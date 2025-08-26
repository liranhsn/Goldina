import { useEffect, useState } from "react";
import "./ui.css";
import AccessoriesView from "./views/AccessoriesView";
import MetalView from "./views/MetalView";

export default function App() {
  const [route, setRoute] = useState<"gold" | "silver" | "accessories">("gold");

  // הגדר שפה וכיווניות לכל האפליקציה
  useEffect(() => {
    document.documentElement.setAttribute("lang", "he");
    document.documentElement.setAttribute("dir", "rtl");
  }, []);

  return (
    <div className="app" dir="rtl">
      <aside className="sidebar">
        <div className="brand"></div>

        <div className="nav">
          <button
            className={`nav-item ${route === "gold" ? "active" : ""}`}
            onClick={() => setRoute("gold")}
          >
            זהב
          </button>
          <button
            className={`nav-item ${route === "silver" ? "active" : ""}`}
            onClick={() => setRoute("silver")}
          >
            כסף
          </button>
          <button
            className={`nav-item ${route === "accessories" ? "active" : ""}`}
            onClick={() => setRoute("accessories")}
          >
            אביזרים
          </button>
        </div>

        <div style={{ marginTop: "auto", color: "var(--muted)", fontSize: 12 }}>
          v1.0 Goldina
        </div>
      </aside>

      <main className="content">
        {route === "gold" && <MetalView metal="gold" key="gold" />}
        {route === "silver" && <MetalView metal="silver" key="silver" />}
        {route === "accessories" && <AccessoriesView />}
      </main>
    </div>
  );
}
