export default function Menu({ onNavigate }: { onNavigate: (r: any) => void }) {
  return (
    <div className="page">
      <h1 className="whiteText">Inventory</h1>
      <div className="grid3">
        <button
          className="big"
          onClick={() => onNavigate({ name: "metal", metal: "gold" })}
        >
          Gold
        </button>
        <button
          className="big"
          onClick={() => onNavigate({ name: "metal", metal: "silver" })}
        >
          Silver
        </button>
        <button
          className="big"
          onClick={() => onNavigate({ name: "accessories" })}
        >
          Accessories
        </button>
      </div>
    </div>
  );
}
