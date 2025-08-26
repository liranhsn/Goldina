export default function Menu({ onNavigate }: { onNavigate: (r: any) => void }) {
  return (
    <div className="page" dir="rtl" lang="he">
      <h1 className="whiteText">מלאי</h1>
      <div className="grid3">
        <button
          className="big"
          onClick={() => onNavigate({ name: "metal", metal: "gold" })}
        >
          זהב
        </button>
        <button
          className="big"
          onClick={() => onNavigate({ name: "metal", metal: "silver" })}
        >
          כסף
        </button>
        <button
          className="big"
          onClick={() => onNavigate({ name: "accessories" })}
        >
          אביזרים
        </button>
      </div>
    </div>
  );
}
