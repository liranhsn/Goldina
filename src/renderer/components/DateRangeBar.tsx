export default function DateRangeBar({
  fromYMD,
  toYMD,
  onFromChange,
  onToChange,
  onResetToToday,
  onReset,
}: {
  fromYMD: string;
  toYMD: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onResetToToday: () => void;
  onReset: () => void;
}) {
  return (
    <div className="range-pill" aria-label="טווח תאריכים">
      <span className="label">טווח תאריכים</span>
      <input
        type="date"
        dir="ltr"
        value={fromYMD}
        onChange={(e) => onFromChange(e.target.value)}
        className="date"
        aria-label="מתאריך"
      />
      <span className="dash">–</span>
      <input
        type="date"
        dir="ltr"
        value={toYMD}
        onChange={(e) => onToChange(e.target.value)}
        className="date"
        aria-label="עד תאריך"
      />
      <span className="sep" />
      <button className="chip" onClick={onResetToToday} title="היום">
        היום
      </button>
      <button
        className="chip"
        onClick={onReset}
        title="ברירת מחדל: החודש הנוכחי"
      >
        החודש
      </button>
    </div>
  );
}
