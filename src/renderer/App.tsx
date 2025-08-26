import { useState } from "react";
import Menu from "./views/Menu";
import MetalView from "./views/MetalView";
import AccessoriesView from "./views/AccessoriesView";

type Route =
  | { name: "menu" }
  | { name: "metal"; metal: "gold" | "silver" }
  | { name: "accessories" };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "menu" });

  if (route.name === "menu") return <Menu onNavigate={setRoute} />;
  if (route.name === "metal")
    return (
      <MetalView
        metal={route.metal}
        onBack={() => setRoute({ name: "menu" })}
      />
    );
  return <AccessoriesView onBack={() => setRoute({ name: "menu" })} />;
}
