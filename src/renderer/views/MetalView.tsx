import React, { useEffect, useState } from "react";

type Props = { metal: "gold" | "silver"; onBack: () => void };
type Tx = { at: string; deltaGrams: number; note?: string };

export default function MetalView({ metal, onBack }: Props) {
  const [balance, setBalance] = useState(0);
  const [recent, setRecent] = useState<Tx[]>([]);
  const [addQty, setAddQty] = useState("1.000");
  const [sellQty, setSellQty] = useState("1.000");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const d = await window.api.getMetalDashboard(metal);
      setBalance(d.balanceGrams);
      setRecent(d.recent);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }

  useEffect(() => {
    load();
  }, [metal]);

  async function doAdd() {
    try {
      const d = await window.api.addMetal(
        metal,
        Number(addQty),
        note || undefined
      );
      setBalance(d.balanceGrams);
      setRecent(d.recent);
      setNote("");
      setError(null);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }
  async function doSell() {
    try {
      const d = await window.api.sellMetal(
        metal,
        Number(sellQty),
        note || undefined
      );
      setBalance(d.balanceGrams);
      setRecent(d.recent);
      setNote("");
      setError(null);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }

  return (
    <div className="page">
      <button onClick={onBack}>&larr; Back</button>
      <h2>{metal.toUpperCase()}</h2>
      <div className="balance">
        Balance: <b>{balance.toFixed(3)}</b> g
      </div>

      {error && <div className="error">{error}</div>}

      <div className="row">
        <div className="card">
          <h3>Add grams</h3>
          <input value={addQty} onChange={(e) => setAddQty(e.target.value)} />
          <input
            placeholder="note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button onClick={doAdd}>Save</button>
        </div>
        <div className="card">
          <h3>Sell grams</h3>
          <input value={sellQty} onChange={(e) => setSellQty(e.target.value)} />
          <input
            placeholder="note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button onClick={doSell} disabled={Number(sellQty) > balance}>
            Save
          </button>
        </div>
      </div>

      <h3>Recent</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Δ grams</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((t, i) => (
            <tr key={i}>
              <td>{new Date(t.at).toLocaleString()}</td>
              <td className={t.deltaGrams >= 0 ? "pos" : "neg"}>
                {t.deltaGrams >= 0 ? "+" : ""}
                {t.deltaGrams.toFixed(3)}
              </td>
              <td>{t.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
