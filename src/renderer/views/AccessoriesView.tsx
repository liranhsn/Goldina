import { useEffect, useState } from "react";
import { AccFilter } from "../../types";
import { Modal } from "../components/Modal";
import { Field } from "../components/Field";
import { AccessoryItem } from "../../../electron/main/types";

export default function AccessoriesView() {
  const [filter, setFilter] = useState<AccFilter>("available");
  const [items, setItems] = useState<AccessoryItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState<AccessoryItem | null>(null);

  async function load() {
    setItems(await window.api.listAccessories(filter));
  }
  useEffect(() => {
    load();
  }, [filter]);

  return (
    <>
      <div className="header">
        <div className="hstack">
          <div className="title">אביזרים</div>
          <button
            className={`tag ${filter === "available" ? "active" : ""}`}
            onClick={() => setFilter("available")}
          >
            זמינים
          </button>
          <button
            className={`tag ${filter === "sold" ? "active" : ""}`}
            onClick={() => setFilter("sold")}
          >
            נמכרו
          </button>
          <button
            className={`tag ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            הכול
          </button>
        </div>
        <div className="hstack">
          <button className="btn gold" onClick={() => setAddOpen(true)}>
            הוסף פריט
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-h">רשימת פריטים</div>
        <div className="card-b" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>סוג</th>
                <th>תיאור</th>
                <th>מחיר</th>
                <th>קוד</th>
                <th>נוסף בתאריך</th>
                <th>נמכר בתאריך</th>
                <th>מחיר מכירה</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.type}</td>
                  <td>{it.description}</td>
                  <td>{it.price?.toFixed(2)}</td>
                  <td>{it.sku != null ? it.sku : "-"}</td>
                  <td>{new Date(it.addedAt).toLocaleString("he-IL")}</td>
                  <td>
                    {it.soldAt
                      ? new Date(it.soldAt).toLocaleString("he-IL")
                      : "-"}
                  </td>
                  <td>
                    {it.soldPrice != null ? it.soldPrice?.toFixed(2) : "-"}
                  </td>
                  <td>
                    {!it.soldAt && (
                      <button className="btn" onClick={() => setSellOpen(it)}>
                        מכירה
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
                    אין פריטים.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddAccessoryModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        afterAdd={load}
      />
      <SellAccessoryModal
        item={sellOpen}
        onClose={() => setSellOpen(null)}
        afterSell={load}
      />
    </>
  );
}

function AddAccessoryModal({
  open,
  onClose,
  afterAdd,
}: {
  open: boolean;
  onClose: () => void;
  afterAdd: () => void;
}) {
  const [type, setType] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");

  return (
    <Modal
      title="הוספת פריט"
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
              if (!type || !desc || isNaN(p) || p < 0)
                return alert("יש למלא: סוג, תיאור ומחיר ≥ 0");
              await window.api.addAccessory({
                type,
                description: desc,
                price: p,
                sku: sku || undefined,
              });
              onClose();
              setType("");
              setDesc("");
              setPrice("");
              setSku("");
              afterAdd();
            }}
          >
            שמירה
          </button>
        </>
      }
    >
      <Field label="סוג">
        <input
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="שעון / תיק / ..."
        />
      </Field>
      <Field label="תיאור">
        <input
          className="input"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="הכנס תיאור של המוצר"
        />
      </Field>
      <Field label="מחיר">
        <input
          className="number"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="הכנס מחיר"
        />
      </Field>
      <Field label="בר-קוד (אופציונלי)">
        <input
          className="input"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="לדגומא SKU-5812"
        />
      </Field>
    </Modal>
  );
}

function SellAccessoryModal({
  item,
  onClose,
  afterSell,
}: {
  item: AccessoryItem | null;
  onClose: () => void;
  afterSell: () => void;
}) {
  const [soldPrice, setSoldPrice] = useState("");
  useEffect(() => {
    setSoldPrice(item?.price?.toString() ?? "");
  }, [item?.id]);

  if (!item) return null;
  return (
    <Modal
      title={`מכירת פריט: ${item.type}`}
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
              const p = soldPrice ? Number(soldPrice) : undefined;
              if (p != null && (isNaN(p) || p < 0))
                return alert("מחיר מכירה חייב להיות ≥ 0");
              await window.api.sellAccessory(item.id, p);
              onClose();
              afterSell();
            }}
          >
            מכירה
          </button>
        </>
      }
    >
      <div className="tag">מחיר מקורי: {item.price?.toFixed(2)}</div>
      <Field label="מחיר מכירה (אופציונלי)">
        <input
          className="number"
          inputMode="decimal"
          value={soldPrice}
          onChange={(e) => setSoldPrice(e.target.value)}
          placeholder={`${item.price?.toFixed(2)}`}
        />
      </Field>
    </Modal>
  );
}
