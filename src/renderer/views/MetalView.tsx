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
  const [editTx, setEditTx] = useState<{
    id: string;
    deltaGrams: number;
    price: number;
    note?: string;
  } | null>(null);
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
                <th>מחיר</th>
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
                  <td>{tx.price}</td>
                  <td>{tx.note ?? "-"}</td>
                  <td className="hstack" style={{ gap: 6 }}>
                    <button
                      className="btn"
                      onClick={() =>
                        setEditTx({
                          id: tx.id,
                          deltaGrams: tx.deltaGrams,
                          price: tx.price,
                          note: tx.note ?? undefined,
                        })
                      }
                    >
                      עריכה
                    </button>
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

      <EditMetalTxModal
        item={editTx}
        metal={metal}
        onClose={() => setEditTx(null)}
        afterSave={(res) => setDash(res)}
      />
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

function EditMetalTxModal({
  item,
  metal,
  onClose,
  afterSave,
}: {
  item: { id: string; deltaGrams: number; price: number; note?: string } | null;
  metal: Metal;
  onClose: () => void;
  afterSave: (dash: MetalDashboard) => void;
}) {
  const [grams, setGrams] = useState("");
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setGrams(item ? Math.abs(item.deltaGrams).toFixed(3) : "");
    setPrice(item ? String(item.price) : "");
    setNote(item?.note ?? "");
  }, [item?.id]);

  if (!item) return null;
  const isSell = item.deltaGrams < 0;
  const metalLabel = METAL_LABEL[metal];

  return (
    <Modal
      title={`עריכת ${isSell ? "מכירה" : "רכישה"} – ${metalLabel}`}
      open={!!item}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            ביטול
          </button>
          <button
            className="btn gold"
            onClick={async () => {
              const g = Number(grams);
              const p = Number(price);
              if (!g || g <= 0) return alert("כמות גרמים חייבת להיות > 0");
              try {
                const res = await window.api.updateMetalTx(
                  item.id,
                  metal,
                  g,
                  p,
                  note || undefined
                );
                onClose();
                afterSave(res);
              } catch (e: any) {
                alert(e.message ?? String(e));
              }
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
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
      </Field>
      <Field label="מחיר">
        <input
          className="number"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </Field>
      <Field label="הערה (אופציונלי)">
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
    </Modal>
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
  const [addPrice, setAddPrice] = useState<string>("");
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
                const price = Number(addPrice);
                if (!grams || grams <= 0)
                  return alert("אנא הזן כמות גרמים גדולה מ־0");
                await window.api.addMetal(
                  metal,
                  grams,
                  price,
                  addNote || undefined
                );
                onCloseAdd();
                setAddGrams("");
                setAddPrice("");
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
        <Field label="מחיר">
          <input
            className="number"
            inputMode="decimal"
            value={addPrice}
            onChange={(e) => setAddPrice(e.target.value)}
            placeholder="הכנס מחיר"
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
                const price = Number(addPrice);
                if (!grams || grams <= 0)
                  return alert("אנא הזן כמות גרמים גדולה מ־0");
                if (grams > currentBalance)
                  return alert("לא ניתן למכור יותר מהיתרה הקיימת.");
                await window.api.sellMetal(
                  metal,
                  grams,
                  price,
                  sellNote || undefined
                );
                onCloseSell();
                setSellGrams("");
                setAddPrice("");
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
        <Field label="מחיר">
          <input
            className="number"
            inputMode="decimal"
            value={addPrice}
            onChange={(e) => setAddPrice(e.target.value)}
            placeholder="הכנס מחיר"
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
