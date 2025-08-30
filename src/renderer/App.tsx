import { useEffect, useState } from "react";
import "./ui.css";
import AccessoriesView from "./views/AccessoriesView";
import MetalView from "./views/MetalView";
import ChecksView from "./views/ChecksView";
import FixedExpensesView from "./views/FixedExpensesView";
import HomeDashboard from "./views/HomeDashboard";
import { Field } from "./components/Field";
import { Modal } from "./components/Modal";

export default function App() {
  const [route, setRoute] = useState<
    "home" | "gold" | "silver" | "accessories" | "checks" | "fixedExpenses"
  >("home");

  // --- admin unlock state ---
  const [isUnlocked, setUnlocked] = useState<boolean>(
    () => sessionStorage.getItem("adminUnlocked") === "1"
  );
  const [showUnlock, setShowUnlock] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState<string | null>(null);

  // הגדר שפה וכיווניות לכל האפליקציה
  useEffect(() => {
    document.documentElement.setAttribute("lang", "he");
    document.documentElement.setAttribute("dir", "rtl");
    if (
      !isUnlocked &&
      (route === "home" || route === "checks" || route === "fixedExpenses")
    ) {
      setRoute("gold");
    }
  }, [isUnlocked, route]);

  return (
    <div className="app" dir="rtl">
      <aside className="sidebar">
        <div className="brand"></div>

        <div className="nav">
          {isUnlocked && (
            <>
              {" "}
              <button
                className={`nav-item ${route === "home" ? "active" : ""}`}
                onClick={() => setRoute("home")}
              >
                {" "}
                דף הבית
              </button>{" "}
            </>
          )}

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

          {isUnlocked && (
            <>
              {" "}
              <button
                className={`nav-item ${route === "checks" ? "active" : ""}`}
                onClick={() => setRoute("checks")}
              >
                ניהול צ׳קים
              </button>
            </>
          )}

          {isUnlocked && (
            <>
              {" "}
              <button
                className={`nav-item ${
                  route === "fixedExpenses" ? "active" : ""
                }`}
                onClick={() => setRoute("fixedExpenses")}
              >
                הוצאות קבועות
              </button>
            </>
          )}
        </div>

        <div
          style={{ marginTop: "auto", color: "var(--muted)", fontSize: 12 }}
          onClick={() => setShowUnlock(true)}
        >
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

      <Modal
        title="כניסה לניהול"
        open={showUnlock}
        onClose={() => {
          setShowUnlock(false);
          setPw("");
          setPwErr(null);
        }}
        footer={
          <>
            <button
              className="btn"
              onClick={() => {
                setShowUnlock(false);
                setPw("");
                setPwErr(null);
              }}
            >
              ביטול
            </button>
            <button
              className="btn gold"
              onClick={async () => {
                const ok = await window.api.adminUnlock(pw);
                if (ok) {
                  setUnlocked(true);
                  sessionStorage.setItem("adminUnlocked", "1");
                  setShowUnlock(false);
                  setPw("");
                  setPwErr(null);
                } else {
                  setPwErr("סיסמה שגויה");
                }
              }}
            >
              כניסה
            </button>
          </>
        }
      >
        <Field label="סיסמה">
          <input
            className="input"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="הקלד סיסמה"
            autoFocus
          />
        </Field>
        {pwErr && (
          <div style={{ color: "var(--danger)", marginTop: 6 }}>{pwErr}</div>
        )}
      </Modal>
    </div>
  );
}
