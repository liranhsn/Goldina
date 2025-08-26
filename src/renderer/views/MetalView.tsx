import { useEffect, useState } from "react";
import { Metal, MetalDashboard } from "../../types";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import DateRangeBar from "../components/DateRangeBar";

const METAL_LABEL: Record<"gold" | "silver", string> = {
  gold: "זהב",
  silver: "כסף",
};
/* ---------- מסך מתכת (זהב/כסף) ---------- */
export default function MetalView({ metal }: { metal: Metal }) {
  const [dash, setDash] = useState<MetalDashboard | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const metalLabel = metal === "gold" ? "זהב" : "כסף";

  // --------- טווח תאריכים: ברירת מחדל = החודש הנוכחי ---------
  function getThisMonthRange() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1); // 1 בחודש, 00:00
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1); // תחילת החודש הבא (אקסקלוסיבי)
    // לשדות ה-date צריך YYYY-MM-DD, ולשרת נשלח ISO מלא
    const toYMD = (d: Date) => d.toISOString().slice(0, 10);
    return {
      fromYMD: toYMD(from),
      toYMD: toYMD(new Date(to.getTime() - 1)), // לתצוגה נשמור יום קודם (לא חובה)
      fromISO: from.toISOString(),
      toISO: to.toISOString(), // אקסקלוסיבי
    };
  }

  const init = getThisMonthRange();
  const [fromYMD, setFromYMD] = useState(init.fromYMD);
  const [toYMD, setToYMD] = useState(init.toYMD);

  async function load(range?: { fromISO?: string; toISO?: string }) {
    const res = await window.api.getMetalDashboard(
      metal,
      range?.fromISO,
      range?.toISO
    );
    setDash(res);
  }

  // טען בהתחלה ובכל שינוי של טווח
  useEffect(() => {
    const fromISO = new Date(fromYMD + "T00:00:00").toISOString();
    // כדי לכלול את היום האחרון כולו—נשתמש בתחילת היום הבא כאקסקלוסיבי
    const toDate = new Date(toYMD + "T00:00:00");
    const toNextDay = new Date(
      toDate.getFullYear(),
      toDate.getMonth(),
      toDate.getDate() + 1
    );
    const toISO = toNextDay.toISOString();

    load({ fromISO, toISO });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metal, fromYMD, toYMD]);

  function resetToThisMonth() {
    const m = getThisMonthRange();
    setFromYMD(m.fromYMD);
    setToYMD(m.toYMD);
  }

  function resetToToday() {
    const nowAsISODate = new Date().toISOString().slice(0, 10);
    setFromYMD(nowAsISODate);
    setToYMD(nowAsISODate);
  }

  return (
    <>
      <div className="header">
        <div className="hstack">
          <div className="title">{metalLabel}</div>
          <span className="tag">יתרה</span>
          <div className="btn gold" style={{ cursor: "default" }}>
            {dash ? `${dash.totalGrams?.toFixed(3)} גרם` : "..."}
          </div>
        </div>

        <div className="hstack header-actions">
          <div className="actions">
            <button className="btn gold" onClick={() => setAddOpen(true)}>
              הוספת גרמים
            </button>
            <button className="btn" onClick={() => setSellOpen(true)}>
              מכירת גרמים
            </button>
          </div>
        </div>
      </div>

      <section className="card">
        <div className="card-h">
          עסקאות אחרונות &nbsp; &nbsp;
          <DateRangeBar
            fromYMD={fromYMD}
            toYMD={toYMD}
            onFromChange={setFromYMD}
            onToChange={setToYMD}
            onReset={resetToThisMonth}
            onResetToToday={resetToToday}
          />
        </div>
        <div className="card-b" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>גרמים</th>
                <th>הערה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {(dash?.recent ?? []).map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.at).toLocaleString("he-IL")}</td>
                  <td
                    className={`delta ${tx.deltaGrams >= 0 ? "plus" : "minus"}`}
                  >
                    {tx.deltaGrams >= 0 ? "+" : ""}
                    {tx.deltaGrams?.toFixed(3)} גרם
                  </td>
                  <td>{tx.note ?? "-"}</td>
                  <td>
                    <button
                      className="btn danger"
                      onClick={async () => {
                        const ok = confirm(
                          "למחוק את העסקה? פעולה זו תשפיע על היתרה."
                        );
                        if (!ok) return;
                        try {
                          const res = await window.api.deleteMetalTx(
                            tx.id,
                            metal
                          );
                          setDash(res);
                        } catch (e: any) {
                          alert(e.message ?? String(e));
                        }
                      }}
                    >
                      מחיקה
                    </button>
                  </td>
                </tr>
              ))}
              {dash && dash.recent.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "var(--muted)" }}>
                    אין עסקאות בטווח שנבחר.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddSellModals
        metal={metal}
        addOpen={addOpen}
        onCloseAdd={() => setAddOpen(false)}
        sellOpen={sellOpen}
        onCloseSell={() => setSellOpen(false)}
        afterChange={() => {
          // טען שוב לפי הטווח הנוכחי
          const fromISO = new Date(fromYMD + "T00:00:00").toISOString();
          const toDate = new Date(toYMD + "T00:00:00");
          const toNextDay = new Date(
            toDate.getFullYear(),
            toDate.getMonth(),
            toDate.getDate() + 1
          );
          const toISO = toNextDay.toISOString();
          load({ fromISO, toISO });
        }}
        currentBalance={dash?.totalGrams ?? 0}
      />
    </>
  );
}

function AddSellModals({
  metal,
  addOpen,
  onCloseAdd,
  sellOpen,
  onCloseSell,
  afterChange,
  currentBalance,
}: {
  metal: Metal;
  addOpen: boolean;
  onCloseAdd: () => void;
  sellOpen: boolean;
  onCloseSell: () => void;
  afterChange: () => void;
  currentBalance: number;
}) {
  const metalLabel = METAL_LABEL[metal];
  const [addGrams, setAddGrams] = useState<string>("");
  const [addNote, setAddNote] = useState("");
  const [sellGrams, setSellGrams] = useState<string>("");
  const [sellNote, setSellNote] = useState("");

  return (
    <>
      <Modal
        title={`הוספת גרמים – ${metalLabel}`}
        open={addOpen}
        onClose={onCloseAdd}
        footer={
          <>
            <button className="btn" onClick={onCloseAdd}>
              ביטול
            </button>
            <button
              className="btn gold"
              onClick={async () => {
                const grams = Number(addGrams);
                if (!grams || grams <= 0)
                  return alert("אנא הזן כמות גרמים גדולה מ־0");
                await window.api.addMetal(metal, grams, addNote || undefined);
                onCloseAdd();
                setAddGrams("");
                setAddNote("");
                afterChange();
              }}
            >
              שמירה
            </button>
          </>
        }
      >
        <Field label="גרמים">
          <input
            className="number"
            inputMode="decimal"
            value={addGrams}
            onChange={(e) => setAddGrams(e.target.value)}
            placeholder="לדוגמה 12.345"
          />
        </Field>
        <Field label="הערה (אופציונלי)">
          <input
            className="input"
            value={addNote}
            onChange={(e) => setAddNote(e.target.value)}
            placeholder="ספק / סיבה"
          />
        </Field>
      </Modal>

      <Modal
        title={`מכירת גרמים – ${metalLabel}`}
        open={sellOpen}
        onClose={onCloseSell}
        footer={
          <>
            <button className="btn" onClick={onCloseSell}>
              ביטול
            </button>
            <button
              className="btn gold"
              onClick={async () => {
                const grams = Number(sellGrams);
                if (!grams || grams <= 0)
                  return alert("אנא הזן כמות גרמים גדולה מ־0");
                if (grams > currentBalance)
                  return alert("לא ניתן למכור יותר מהיתרה הקיימת.");
                await window.api.sellMetal(metal, grams, sellNote || undefined);
                onCloseSell();
                setSellGrams("");
                setSellNote("");
                afterChange();
              }}
            >
              מכירה
            </button>
          </>
        }
      >
        <div className="tag">יתרה זמינה: {currentBalance?.toFixed(3)} גרם</div>
        <Field label="גרמים">
          <input
            className="number"
            inputMode="decimal"
            value={sellGrams}
            onChange={(e) => setSellGrams(e.target.value)}
            placeholder="לדוגמה 1.250"
          />
        </Field>
        <Field label="הערה (אופציונלי)">
          <input
            className="input"
            value={sellNote}
            onChange={(e) => setSellNote(e.target.value)}
            placeholder="לקוח / חשבונית"
          />
        </Field>
      </Modal>
    </>
  );
}
