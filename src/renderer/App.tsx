import { useEffect, useState } from "react";
import "./ui.css";
import AccessoriesView from "./views/AccessoriesView";
import MetalView from "./views/MetalView";
import ChecksView from "./views/ChecksView";
import FixedExpensesView from "./views/FixedExpensesView";
import HomeDashboard from "./views/HomeDashboard";

export default function App() {
  const [route, setRoute] = useState<
    "home" | "gold" | "silver" | "accessories" | "checks" | "fixedExpenses"
  >("home");

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
            className={`nav-item ${route === "home" ? "active" : ""}`}
            onClick={() => setRoute("home")}
          >
            דף הבית
          </button>
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
          <button
            className={`nav-item ${route === "checks" ? "active" : ""}`}
            onClick={() => setRoute("checks")}
          >
            ניהול צ׳קים
          </button>
          <button
            className={`nav-item ${route === "fixedExpenses" ? "active" : ""}`}
            onClick={() => setRoute("fixedExpenses")}
          >
            הוצאות קבועות
          </button>
        </div>

        <div style={{ marginTop: "auto", color: "var(--muted)", fontSize: 12 }}>
          v1.0 Goldina
        </div>
      </aside>

      <main className="content">
        {route === "home" && <HomeDashboard onNavigate={setRoute} />}
        {route === "gold" && <MetalView metal="gold" key="gold" />}
        {route === "silver" && <MetalView metal="silver" key="silver" />}
        {route === "accessories" && <AccessoriesView />}
        {route === "checks" && <ChecksView />}
        {route === "fixedExpenses" && <FixedExpensesView />}
      </main>
    </div>
  );
}
