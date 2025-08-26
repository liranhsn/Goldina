import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";

type Fx = { id: string; name: string; price: number; createdAt: string };

export default function FixedExpensesView() {
  const [items, setItems] = useState<Fx[]>([]);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Fx | null>(null);
  const [total, setTotal] = useState(0);

  const formatILS = (n: number) =>
    n.toLocaleString("he-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 2,
    });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => x.name.toLowerCase().includes(q));
  }, [items, search]);

  async function load() {
    const list = await window.api.listFixedExpenses();
    setItems(list);
    setTotal(
      list.reduce((sum: number, x: any) => sum + (Number(x.price) || 0), 0)
    );
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="header">
        <div className="title">
          הוצאות קבועות &nbsp;&nbsp;{" "}
          <span className="tag gold " style={{ marginInlineStart: 8 }}>
            סה״כ: {formatILS(total)}
          </span>
        </div>

        <div className="hstack">
          <button className="btn gold" onClick={() => setAddOpen(true)}>
            הוסף הוצאה
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-h">רשימת הוצאות </div>
        <div className="card-b" style={{ overflowX: "auto" }}>
          <table className="table" dir="rtl">
            <thead>
              <tr>
                <th style={{ textAlign: "right" }}>שם הוצאה</th>
                <th style={{ textAlign: "right" }}>מחיר</th>
                <th style={{ width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fx) => (
                <tr key={fx.id}>
                  <td style={{ textAlign: "right" }}>{fx.name}</td>
                  <td style={{ textAlign: "right" }}>
                    {fx.price.toLocaleString("he-IL", {
                      style: "currency",
                      currency: "ILS",
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className="hstack"
                    style={{ gap: 6, justifyContent: "flex-start" }}
                  >
                    <button className="btn" onClick={() => setEditItem(fx)}>
                      עריכה
                    </button>
                    <button
                      className="btn danger"
                      onClick={async () => {
                        if (!confirm("למחוק את ההוצאה?")) return;
                        await window.api.deleteFixedExpense(fx.id);
                        await load();
                      }}
                    >
                      מחיקה
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{ color: "var(--muted)", textAlign: "center" }}
                  >
                    אין נתונים.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddExpenseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        afterSave={load}
      />
      <EditExpenseModal
        item={editItem}
        onClose={() => setEditItem(null)}
        afterSave={load}
      />
    </>
  );
}

function AddExpenseModal({
  open,
  onClose,
  afterSave,
}: {
  open: boolean;
  onClose: () => void;
  afterSave: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");

  return (
    <Modal
      title="הוספת הוצאה קבועה"
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
              const p = Number(price);
              if (!name.trim() || isNaN(p) || p < 0) {
                alert("יש למלא שם ומחיר ≥ 0");
                return;
              }
              await window.api.addFixedExpense({ name: name.trim(), price: p });
              onClose();
              setName("");
              setPrice("0");
              afterSave();
            }}
          >
            שמירה
          </button>
        </>
      }
    >
      <Field label="שם הוצאה">
        <input
          className="input"
          dir="rtl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: שכירות"
        />
      </Field>
      <Field label="מחיר">
        <input
          className="number"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
        />
      </Field>
    </Modal>
  );
}

function EditExpenseModal({
  item,
  onClose,
  afterSave,
}: {
  item: Fx | null;
  onClose: () => void;
  afterSave: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");

  useEffect(() => {
    setName(item?.name ?? "");
    setPrice(item ? String(item.price) : "0");
  }, [item?.id]);

  if (!item) return null;

  return (
    <Modal
      title="עריכת הוצאה"
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
              const p = Number(price);
              if (!name.trim() || isNaN(p) || p < 0) {
                alert("יש למלא שם ומחיר ≥ 0");
                return;
              }
              await window.api.updateFixedExpense({
                id: item.id,
                name: name.trim(),
                price: p,
              });
              onClose();
              afterSave();
            }}
          >
            שמירה
          </button>
        </>
      }
    >
      <Field label="שם הוצאה">
        <input
          className="input"
          dir="rtl"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
    </Modal>
  );
}
