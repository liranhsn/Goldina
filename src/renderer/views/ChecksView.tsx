import { useEffect, useMemo, useState } from "react";
import { Field } from "../components/Field";
import { Modal } from "../components/Modal";

type Status = "issued" | "deposited" | "returned" | "cancelled" | "all";
type CheckItem = {
  id: string;
  bank: string;
  number: string;
  payee: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: Exclude<Status, "all">;
  notes?: string | null;
  depositedAt?: string | null;
  clearedAt?: string | null;
};

export default function ChecksView() {
  const [status, setStatus] = useState<Status>("issued");
  const [items, setItems] = useState<CheckItem[]>([]);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);

  // טווח תאריכים – ברירת מחדל: החודש הנוכחי
  const init = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of this month
    const end = new Date(now.getFullYear() + 5, now.getMonth(), 0); // up to 5 years
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { fromYMD: fmt(start), toYMD: fmt(end) };
  }, []);

  const [fromYMD, setFromYMD] = useState(init.fromYMD);
  const [toYMD, setToYMD] = useState(init.toYMD);

  async function load() {
    const list = await window.api.listChecks({
      status,
      fromISO: fromYMD,
      toISO: toYMD,
      search: search.trim() || undefined,
    });

    setItems(list);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, fromYMD, toYMD]);

  function resetMonth() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setFromYMD(fmt(from));
    setToYMD(fmt(to));
  }

  return (
    <>
      <div className="header">
        <div className="hstack">
          <div className="title">צ׳קים</div>
          <button
            className={`tag ${status === "issued" ? "active" : ""}`}
            onClick={() => setStatus("issued")}
          >
            פתוחים
          </button>
          <button
            className={`tag ${status === "deposited" ? "active" : ""}`}
            onClick={() => setStatus("deposited")}
          >
            הופקדו
          </button>
          <button
            className={`tag ${status === "returned" ? "active" : ""}`}
            onClick={() => setStatus("returned")}
          >
            חזרו
          </button>
          <button
            className={`tag ${status === "cancelled" ? "active" : ""}`}
            onClick={() => setStatus("cancelled")}
          >
            בוטלו
          </button>
          <button
            className={`tag ${status === "all" ? "active" : ""}`}
            onClick={() => setStatus("all")}
          >
            כולם
          </button>{" "}
          &nbsp; &nbsp;
          <input
            className="input"
            style={{ maxWidth: 200 }}
            placeholder="חיפוש לפי מספר/מוטב…"
            dir="rtl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>

        <div className="hstack header-actions">
          <button className="btn gold" onClick={() => setOpenAdd(true)}>
            הוסף צ׳ק
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-h">
          רשימת צ׳קים&nbsp;&nbsp;
          <div className="range-pill">
            <span className="label">טווח תאריכים</span>
            <input
              type="date"
              className="date"
              value={fromYMD}
              onChange={(e) => setFromYMD(e.target.value)}
            />
            <span className="dash">–</span>
            <input
              type="date"
              className="date"
              value={toYMD}
              onChange={(e) => setToYMD(e.target.value)}
            />
            <span className="sep" />
          </div>{" "}
        </div>

        <div className="card-b" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>מס׳</th>
                <th>בנק</th>
                <th>מוטב</th>
                <th>סכום</th>
                <th>תאריך הנפקה</th>
                <th>תאריך פירעון</th>
                <th>סטטוס</th>
                <th>הערות</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.number}</td>
                  <td>{c.bank}</td>
                  <td>{c.payee}</td>
                  <td>{c.amount.toFixed(2)}</td>
                  <td>{new Date(c.issueDate).toLocaleDateString("he-IL")}</td>
                  <td>{new Date(c.dueDate).toLocaleDateString("he-IL")}</td>
                  <td>
                    <span className={`tag ${c.status}`}>
                      {c.status === "issued"
                        ? "פתוח"
                        : c.status === "deposited"
                        ? "הופקד"
                        : c.status === "returned"
                        ? "חזר"
                        : "בוטל"}
                    </span>
                  </td>
                  <td>{c.notes ?? "-"}</td>
                  <td className="hstack" style={{ gap: 6 }}>
                    {c.status === "issued" && (
                      <>
                        <button
                          className="btn"
                          onClick={async () => {
                            await window.api.updateCheckStatus(
                              c.id,
                              "deposited"
                            );
                            await load();
                          }}
                        >
                          סימון כהופקד
                        </button>
                        <button
                          className="btn"
                          onClick={async () => {
                            await window.api.updateCheckStatus(
                              c.id,
                              "cancelled"
                            );
                            await load();
                          }}
                        >
                          ביטול
                        </button>
                        <button
                          className="btn danger"
                          onClick={async () => {
                            if (!confirm("למחוק את הצ׳ק?")) return;
                            await window.api.deleteCheck(c.id);
                            await load();
                          }}
                        >
                          מחיקה
                        </button>
                      </>
                    )}
                    {c.status === "deposited" && (
                      <button
                        className="btn"
                        onClick={async () => {
                          await window.api.updateCheckStatus(c.id, "returned");
                          await load();
                        }}
                      >
                        סימון כחזר
                      </button>
                    )}
                    {(c.status === "returned" || c.status === "cancelled") && (
                      <button
                        className="btn danger"
                        onClick={async () => {
                          if (!confirm("למחוק את הצ׳ק?")) return;
                          await window.api.deleteCheck(c.id);
                          await load();
                        }}
                      >
                        מחיקה
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ color: "var(--muted)" }}>
                    אין נתונים בטווח/סינון הנוכחי.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddCheckModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        afterAdd={load}
      />
    </>
  );
}

function AddCheckModal({
  open,
  onClose,
  afterAdd,
}: {
  open: boolean;
  onClose: () => void;
  afterAdd: () => void;
}) {
  const todayYMD = new Date().toISOString().slice(0, 10);
  const in30YMD = new Date(Date.now() + 30 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [bank, setBank] = useState("");
  const [number, setNumber] = useState("");
  const [payee, setPayee] = useState("");
  const [amount, setAmount] = useState("");
  const [issueYMD, setIssueYMD] = useState(todayYMD);
  const [dueYMD, setDueYMD] = useState(in30YMD);
  const [notes, setNotes] = useState("");

  return (
    <Modal
      title="הוספת צ׳ק"
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            ביטול
          </button>
          <button
            className="btn gold"
            onClick={async () => {
              const amt = Number(amount);
              if (!number.trim() || !payee.trim() || isNaN(amt) || amt <= 0) {
                alert("יש למלא מספר, מוטב וסכום גדול מ־0");
                return;
              }
              const issueISO = new Date(issueYMD + "T00:00:00").toISOString();
              const dueISO = new Date(dueYMD + "T00:00:00").toISOString();
              await window.api.addCheck({
                bank: bank.trim(),
                number: number.trim(),
                payee: payee.trim(),
                amount: amt,
                issueDateISO: issueISO,
                dueDateISO: dueISO,
                notes: notes.trim() || undefined,
              });
              onClose();
              setBank("");
              setNumber("");
              setPayee("");
              setAmount("");
              setNotes("");
              setIssueYMD(todayYMD);
              setDueYMD(in30YMD);
              afterAdd();
            }}
          >
            שמירה
          </button>
        </>
      }
    >
      <Field label="בנק">
        <input
          className="input"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          placeholder="סוג בנק לאומי/מזרחי/פועלים"
        />
      </Field>
      <Field label="מס׳ צ׳ק">
        <input
          className="input"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="123456"
        />
      </Field>
      <Field label="מוטב">
        <input
          className="input"
          value={payee}
          onChange={(e) => setPayee(e.target.value)}
          placeholder="שם המוטב"
        />
      </Field>
      <Field label="סכום">
        <input
          className="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000.00"
        />
      </Field>
      <Field label="תאריך הנפקה">
        <input
          type="date"
          className="input"
          value={issueYMD}
          onChange={(e) => setIssueYMD(e.target.value)}
        />
      </Field>
      <Field label="תאריך פירעון">
        <input
          type="date"
          className="input"
          value={dueYMD}
          onChange={(e) => setDueYMD(e.target.value)}
        />
      </Field>
      <Field label="הערות (אופציונלי)">
        <input
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="הערה פנימית"
        />
      </Field>
    </Modal>
  );
}
