import { useEffect, useState } from "react";
import "./ui.css";
import { Modal } from "./components/Modal";
import { Field } from "./components/Field";

type Metal = "gold" | "silver";
type AccFilter = "available" | "sold" | "all";

type MetalTx = { id: string; at: string; deltaGrams: number; note?: string };
type MetalDashboard = { totalGrams: number; recent: MetalTx[] };

type Accessory = {
  id: string;
  type: string;
  description: string;
  price: number;
  addedAt: string;
  soldAt?: string | null;
  soldPrice?: number;
  sku?: string;
};

const NavBtn = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`btn ghost ${active ? "active" : ""}`}
    style={{ justifyContent: "space-between" }}
  >
    <span>{label}</span>
    {active && <span className="tag active">selected</span>}
  </button>
);

export default function App() {
  const [route, setRoute] = useState<"gold" | "silver" | "accessories">("gold");

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="badge" />
          <h1>Goldina</h1>
        </div>

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
        {route === "gold" && <MetalView metal="gold" />}
        {route === "silver" && <MetalView metal="silver" />}
        {route === "accessories" && <AccessoriesView />}
      </main>
    </div>
  );
}

/* ---------- Metal screen ---------- */
function MetalView({ metal }: { metal: Metal }) {
  const [dash, setDash] = useState<MetalDashboard | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const metalName = metal[0].toUpperCase() + metal.slice(1);

  async function load() {
    const res = await window.api.getMetalDashboard(metal);
    setDash(res);
  }
  useEffect(() => {
    load();
  }, [metal]);

  return (
    <>
      <div className="header">
        <div className="hstack">
          <div className="title">{metalName}</div>
          <span className="tag">סך הכל</span>
          <div className="btn gold" style={{ cursor: "default" }}>
            {dash ? `${dash.totalGrams?.toFixed(3)} g` : "..."}
          </div>
        </div>
        <div className="hstack">
          <button className="btn gold" onClick={() => setAddOpen(true)}>
            הוסף גרמים
          </button>
          <button className="btn" onClick={() => setSellOpen(true)}>
            למכור גרמים
          </button>
          <button className="btn ghost" onClick={load}>
            רענן
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-h">עסקאות אחרונות</div>
        <div className="card-b" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>גרמים</th>
                <th>הערה</th>
              </tr>
            </thead>
            <tbody>
              {(dash?.recent ?? []).map((tx) => (
                <tr key={tx.id}>
                  <td>{new Date(tx.at).toLocaleString()}</td>
                  <td
                    className={`delta ${tx.deltaGrams >= 0 ? "plus" : "minus"}`}
                  >
                    {tx.deltaGrams >= 0 ? "+" : ""}
                    {tx.deltaGrams?.toFixed(3)} g
                  </td>
                  <td>{tx.note ?? "-"}</td>
                </tr>
              ))}
              {dash && dash.recent.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "var(--muted)" }}>
                    עדיין אין עסקאות.
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
        afterChange={load}
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
  const [addGrams, setAddGrams] = useState<string>("");
  const [addNote, setAddNote] = useState("");
  const [sellGrams, setSellGrams] = useState<string>("");
  const [sellNote, setSellNote] = useState("");

  return (
    <>
      <Modal
        title={`Add ${metal} grams`}
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
                if (!grams || grams <= 0) return alert("Enter grams > 0");
                await window.api.addMetal(metal, grams, addNote || undefined);
                onCloseAdd();
                setAddGrams("");
                setAddNote("");
                afterChange();
              }}
            >
              Save
            </button>
          </>
        }
      >
        <Field label="Grams">
          <input
            className="number"
            inputMode="decimal"
            value={addGrams}
            onChange={(e) => setAddGrams(e.target.value)}
            placeholder="e.g. 12.345"
          />
        </Field>
        <Field label="Note (optional)">
          <input
            className="input"
            value={addNote}
            onChange={(e) => setAddNote(e.target.value)}
            placeholder="Supplier / reason"
          />
        </Field>
      </Modal>

      <Modal
        title={`Sell ${metal} grams`}
        open={sellOpen}
        onClose={onCloseSell}
        footer={
          <>
            <button className="btn" onClick={onCloseSell}>
              Cancel
            </button>
            <button
              className="btn gold"
              onClick={async () => {
                const grams = Number(sellGrams);
                if (!grams || grams <= 0) return alert("Enter grams > 0");
                if (grams > currentBalance)
                  return alert("Cannot sell more than current balance.");
                await window.api.sellMetal(metal, grams, sellNote || undefined);
                onCloseSell();
                setSellGrams("");
                setSellNote("");
                afterChange();
              }}
            >
              Sell
            </button>
          </>
        }
      >
        <div className="tag">Available: {currentBalance?.toFixed(3)} g</div>
        <Field label="Grams">
          <input
            className="number"
            inputMode="decimal"
            value={sellGrams}
            onChange={(e) => setSellGrams(e.target.value)}
            placeholder="e.g. 1.250"
          />
        </Field>
        <Field label="Note (optional)">
          <input
            className="input"
            value={sellNote}
            onChange={(e) => setSellNote(e.target.value)}
            placeholder="Customer / invoice"
          />
        </Field>
      </Modal>
    </>
  );
}

/* ---------- Accessories screen ---------- */
function AccessoriesView() {
  const [filter, setFilter] = useState<AccFilter>("available");
  const [items, setItems] = useState<Accessory[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState<Accessory | null>(null);

  async function load() {
    setItems((await window.api.listAccessories(filter)) as Accessory[]);
  }
  useEffect(() => {
    load();
  }, [filter]);

  return (
    <>
      <div className="header">
        <div className="hstack">
          <div className="title">Accessories</div>
          <button
            className={`tag ${filter === "available" ? "active" : ""}`}
            onClick={() => setFilter("available")}
          >
            Available
          </button>
          <button
            className={`tag ${filter === "sold" ? "active" : ""}`}
            onClick={() => setFilter("sold")}
          >
            Sold
          </button>
          <button
            className={`tag ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
        </div>
        <div className="hstack">
          <button className="btn gold" onClick={() => setAddOpen(true)}>
            Add item
          </button>
          <button className="btn ghost" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <section className="card">
        <div className="card-h">Items</div>
        <div className="card-b" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Price</th>
                <th>Added</th>
                <th>Sold</th>
                <th>Sold price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.type}</td>
                  <td>{it.description}</td>
                  <td>{it.price?.toFixed(2)}</td>
                  <td>{new Date(it.addedAt).toLocaleString()}</td>
                  <td>
                    {it.soldAt ? new Date(it.soldAt).toLocaleString() : "-"}
                  </td>
                  <td>
                    {it.soldPrice != null ? it.soldPrice?.toFixed(2) : "-"}
                  </td>
                  <td>
                    {!it.soldAt && (
                      <button className="btn" onClick={() => setSellOpen(it)}>
                        Sell
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: "var(--muted)" }}>
                    No items.
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
      title="Add accessory"
      open={open}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn gold"
            onClick={async () => {
              const p = Number(price);
              if (!type || !desc || isNaN(p) || p < 0)
                return alert("Fill Type, Description and Price ≥ 0");
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
            Save
          </button>
        </>
      }
    >
      <Field label="Type">
        <input
          className="input"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Ring / Necklace / ..."
        />
      </Field>
      <Field label="Description">
        <input
          className="input"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="14k gold ring, size 7"
        />
      </Field>
      <Field label="Price">
        <input
          className="number"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="199.90"
        />
      </Field>
      <Field label="SKU (optional)">
        <input
          className="input"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="SKU-12345"
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
  item: Accessory | null;
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
      title={`Sell: ${item.type}`}
      open={!!item}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn gold"
            onClick={async () => {
              const p = soldPrice ? Number(soldPrice) : undefined;
              if (p != null && (isNaN(p) || p < 0))
                return alert("Sold price must be ≥ 0");
              await window.api.sellAccessory(item.id, p);
              onClose();
              afterSell();
            }}
          >
            Sell
          </button>
        </>
      }
    >
      <div className="tag">Original price: {item.price?.toFixed(2)}</div>
      <Field label="Sold price (optional)">
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
