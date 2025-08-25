import React, { useEffect, useState } from "react";

type Filter = "available" | "sold" | "all";
type Item = {
  id: string;
  type: string;
  description: string;
  price: number;
  addedAt: string;
  soldAt?: string | null;
  soldPrice?: number | null;
  sku?: string | null;
};

export default function AccessoriesView({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<Filter>("available");
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({
    type: "",
    description: "",
    price: "0",
    sku: "",
  });
  const [sell, setSell] = useState<{ id: string; price: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const list = await window.api.listAccessories(filter);
      setItems(list);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }
  useEffect(() => {
    load();
  }, [filter]);

  async function addItem() {
    try {
      await window.api.addAccessory({
        type: form.type,
        description: form.description,
        price: Number(form.price),
        sku: form.sku || undefined,
      });
      setForm({ type: "", description: "", price: "0", sku: "" });
      load();
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }

  async function sellItem() {
    if (!sell) return;
    try {
      await window.api.sellAccessory(
        sell.id,
        sell.price ? Number(sell.price) : undefined
      );
      setSell(null);
      load();
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }

  return (
    <div className="page">
      <button onClick={onBack}>&larr; Back</button>
      <h2>Accessories</h2>

      {error && <div className="error">{error}</div>}

      <div className="row">
        <div className="card">
          <h3>Add item</h3>
          <input
            placeholder="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <input
            placeholder="SKU (optional)"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />
          <button onClick={addItem}>Save</button>
        </div>
        <div className="card">
          <h3>Filter</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <h3>Items</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Price</th>
            <th>Added</th>
            <th>Sold</th>
            <th>Sold price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.type}</td>
              <td>{i.description}</td>
              <td>{i.price.toFixed(2)}</td>
              <td>{new Date(i.addedAt).toLocaleString()}</td>
              <td>{i.soldAt ? new Date(i.soldAt).toLocaleString() : ""}</td>
              <td>{i.soldPrice != null ? i.soldPrice.toFixed(2) : ""}</td>
              <td>
                {!i.soldAt && (
                  <button
                    onClick={() =>
                      setSell({ id: i.id, price: String(i.price) })
                    }
                  >
                    Sell
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sell && (
        <div className="modal">
          <div className="card">
            <h3>Sell item</h3>
            <input
              placeholder="Sold price"
              value={sell.price}
              onChange={(e) => setSell({ ...sell, price: e.target.value })}
            />
            <div className="row">
              <button onClick={() => setSell(null)}>Cancel</button>
              <button onClick={sellItem}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
