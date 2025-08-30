import { useEffect, useMemo, useState } from "react";

type Metal = "gold" | "silver";
type MetalDash = {
  totalGrams: number;
  recent: Array<{ at: string; deltaGrams: number; note?: string }>;
};

type Accessory = {
  id: string;
  type: string;
  description: string;
  price: number;
  addedAt: string;
  soldAt?: string | null;
  soldPrice?: number | null;
  sku?: string | null;
};

type CheckRow = {
  id: string;
  number: string;
  payee: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: "issued" | "deposited" | "returned" | "cancelled";
  notes?: string | null;
  depositedAt?: string | null;
  clearedAt?: string | null;
};

type Fx = { id: string; name: string; price: number; createdAt: string };

export default function HomeDashboard({
  onNavigate,
}: {
  onNavigate: (
    r: "home" | "gold" | "silver" | "accessories" | "checks" | "fixedExpenses"
  ) => void;
}) {
  // ===== תאריכים (ברירת מחדל: החודש + החודש הבא) =====
  const init = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { fromYMD: fmt(start), toYMD: fmt(end) };
  }, []);
  const [fromYMD, setFromYMD] = useState(init.fromYMD);
  const [toYMD, setToYMD] = useState(init.toYMD);

  // ===== נתונים =====
  const [gold, setGold] = useState<MetalDash | null>(null);
  const [silver, setSilver] = useState<MetalDash | null>(null);
  const [accAvail, setAccAvail] = useState<Accessory[]>([]);
  const [accSold, setAccSold] = useState<Accessory[]>([]);
  const [checksIssued, setChecksIssued] = useState<CheckRow[]>([]);
  const [totalCheckesIssued, setTottalChecksUssued] = useState(0);
  const [checksDeposited, setChecksDeposited] = useState<CheckRow[]>([]);
  const [checksReturned, setChecksReturned] = useState<CheckRow[]>([]);
  const [fx, setFx] = useState<Fx[]>([]);
  const [loading, setLoading] = useState(false);

  const formatILS = (n: number) =>
    n.toLocaleString("he-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 2,
    });
  const fmtNum = (n: number, d = 3) =>
    n.toLocaleString("he-IL", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });

  async function loadAll() {
    setLoading(true);
    try {
      const [g, s, avail, sold, iss, dep, ret, fxList] = await Promise.all([
        window.api.getMetalDashboard("gold" as Metal, undefined, undefined),
        window.api.getMetalDashboard("silver" as Metal, undefined, undefined),
        window.api.listAccessories("available"),
        window.api.listAccessories("sold"),
        window.api.listChecks({
          status: "issued",
          fromISO: fromYMD,
          toISO: toYMD,
        }),
        window.api.listChecks({
          status: "deposited",
          fromISO: fromYMD,
          toISO: toYMD,
        }),
        window.api.listChecks({
          status: "returned",
          fromISO: fromYMD,
          toISO: toYMD,
        }),
        window.api.listFixedExpenses(),
      ]);
      setGold(g);
      setSilver(s);
      setAccAvail(avail);
      setAccSold(sold);
      setChecksIssued(iss);
      setChecksDeposited(dep);
      setChecksReturned(ret);
      setFx(fxList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll(); /* eslint-disable-next-line */
  }, [fromYMD, toYMD]);

  // ===== חישובים =====
  const upcomingIssued = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const in14 = new Date(Date.now() + 14 * 86400000)
      .toISOString()
      .slice(0, 10);
    setTottalChecksUssued(
      checksIssued.reduce(
        (sum: number, x: any) => sum + (Number(x.amount) || 0),
        0
      )
    );
    return checksIssued.filter((c) => c.dueDate >= today && c.dueDate <= in14)
      .length;
  }, [checksIssued]);

  const overdueIssued = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return checksIssued.filter((c) => c.dueDate < today).length;
  }, [checksIssued]);

  const soldInRange = useMemo(() => {
    // sold רשימת מגיעה בלי פילטר תאריכים; נסנן בצד הלקוח
    return accSold.filter(
      (a) =>
        a.soldAt &&
        (a.soldAt as string).slice(0, 10) >= fromYMD &&
        (a.soldAt as string).slice(0, 10) <= toYMD
    );
  }, [accSold, fromYMD, toYMD]);

  const salesRevenueILS = useMemo(() => {
    return soldInRange.reduce(
      (sum, a) => sum + (a.soldPrice ?? a.price ?? 0),
      0
    );
  }, [soldInRange]);

  const fxTotal = useMemo(
    () => fx.reduce((s, x) => s + (Number(x.price) || 0), 0),
    [fx]
  );

  const last3Gold = (gold?.recent ?? []).slice(0, 3);
  const last3Silv = (silver?.recent ?? []).slice(0, 3);

  function setThisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setFromYMD(fmt(start));
    setToYMD(fmt(end));
  }
  function setTwoMonths() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setFromYMD(fmt(start));
    setToYMD(fmt(end));
  }
  function setQuarter() {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) * 3;
    const start = new Date(now.getFullYear(), q, 1);
    const end = new Date(now.getFullYear(), q + 3, 0);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    setFromYMD(fmt(start));
    setToYMD(fmt(end));
  }

  return (
    <div className="dash" dir="rtl">
      <div className="header">
        <div className="hstack">
          <div className="title">דף הבית</div>
          <div className="chip">
            {fromYMD} — {toYMD}
          </div>
          <button className="chip" onClick={setThisMonth}>
            החודש
          </button>
          <button className="chip" onClick={setTwoMonths}>
            החודש+הבא
          </button>
          <button className="chip" onClick={setQuarter}>
            רבעון
          </button>
          <div className="hstack" style={{ gap: 6, marginInlineStart: 8 }}>
            <input
              className="input"
              type="date"
              value={fromYMD}
              onChange={(e) => setFromYMD(e.target.value)}
            />
            <span> - </span>
            <input
              className="input"
              type="date"
              value={toYMD}
              onChange={(e) => setToYMD(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-grid">
        <KpiCard
          title="יתרת זהב (גרם)"
          value={gold ? fmtNum(gold.totalGrams) : "..."}
          onClick={() => onNavigate("gold")}
        />
        <KpiCard
          title="יתרת כסף (גרם)"
          value={silver ? fmtNum(silver.totalGrams) : "..."}
          onClick={() => onNavigate("silver")}
        />
        <KpiCard
          title="אביזרים זמינים"
          value={accAvail.length.toString()}
          onClick={() => onNavigate("accessories")}
        />
        <KpiCard
          title="מכירות אביזרים (₪)"
          value={formatILS(salesRevenueILS)}
          onClick={() => onNavigate("accessories")}
        />
        <KpiCard
          title="ציקים פתוחים (סה״כ)"
          value={formatILS(totalCheckesIssued)}
          onClick={() => onNavigate("checks")}
        />
        <KpiCard
          title="צ׳קים—עומדים לפירעון (14 יום)"
          value={String(upcomingIssued)}
          onClick={() => onNavigate("checks")}
        />
        <KpiCard
          title="צ׳קים—באיחור"
          value={String(overdueIssued)}
          onClick={() => onNavigate("checks")}
        />
        <KpiCard
          title="הוצאות קבועות (סה״כ)"
          value={formatILS(fxTotal)}
          onClick={() => onNavigate("fixedExpenses")}
        />
      </div>

      {/* כרטיסים עם פירוט קצר */}
      <section className="card">
        <div className="card-h hstack">
          <div>תנועות אחרונות - זהב</div>
          <button className="btn ghost" onClick={() => onNavigate("gold")}>
            למסך זהב
          </button>
        </div>
        <div className="card-b">
          <MiniTxList rows={last3Gold} />
        </div>
      </section>

      <section className="card">
        <div className="card-h hstack">
          <div>תנועות אחרונות - כסף</div>
          <button className="btn ghost" onClick={() => onNavigate("silver")}>
            למסך כסף
          </button>
        </div>
        <div className="card-b">
          <MiniTxList rows={last3Silv} />
        </div>
      </section>

      <section className="card">
        <div className="card-h hstack">
          <div>צ׳קים בטווח</div>
          <button className="btn ghost" onClick={() => onNavigate("checks")}>
            למסך צ׳קים
          </button>
        </div>
        <div className="card-b" style={{ overflowX: "auto" }}>
          <table className="table" dir="rtl">
            <thead>
              <tr>
                <th style={{ textAlign: "right" }}>מס׳</th>
                <th style={{ textAlign: "right" }}>מוטב</th>
                <th style={{ textAlign: "right" }}>סכום</th>
                <th style={{ textAlign: "right" }}>לתאריך</th>
                <th style={{ textAlign: "right" }}>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {[...checksIssued, ...checksDeposited, ...checksReturned]
                .filter((c) => c.dueDate >= fromYMD && c.dueDate <= toYMD)
                .slice(0, 8)
                .map((c) => (
                  <tr key={c.id}>
                    <td style={{ textAlign: "right" }}>{c.number}</td>
                    <td style={{ textAlign: "right" }}>{c.payee}</td>
                    <td style={{ textAlign: "right" }}>
                      {formatILS(c.amount)}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      {new Date(c.dueDate).toLocaleString("he-IL")}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {statusLabel(c.status)}
                    </td>
                  </tr>
                ))}
              {checksIssued.length +
                checksDeposited.length +
                checksReturned.length ===
                0 && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ color: "var(--muted)", textAlign: "center" }}
                  >
                    אין צ׳קים בטווח.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  title,
  value,
  onClick,
}: {
  title: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="kpi card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

function MiniTxList({
  rows,
}: {
  rows: Array<{ at: string; deltaGrams: number; note?: string }>;
}) {
  if (!rows.length)
    return <div style={{ color: "var(--muted)" }}>אין תנועות אחרונות.</div>;
  return (
    <div className="mini-list">
      {rows.map((r, idx) => (
        <div key={idx} className="mini-row">
          <div className={`delta ${r.deltaGrams >= 0 ? "plus" : "minus"}`}>
            {r.deltaGrams >= 0 ? "+" : ""}
            {r.deltaGrams.toFixed(3)} g
          </div>
          <div className="muted">{new Date(r.at).toLocaleString("he-IL")}</div>
          <div className="grow">{r.note || "-"}</div>
        </div>
      ))}
    </div>
  );
}

function statusLabel(s: CheckRow["status"]) {
  switch (s) {
    case "issued":
      return "הוצא";
    case "deposited":
      return "הופקד";
    case "returned":
      return "חזר";
    case "cancelled":
      return "בוטל";
  }
}
