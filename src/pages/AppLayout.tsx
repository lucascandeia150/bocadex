import { Routes, Route } from "react-router-dom";
import { BottomTabs } from "@/components/BottomTabs";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useHistory } from "@/hooks/useHistory";
import type { Food } from "@/data/foods";
import HomePage from "./HomePage";
import EconomicoPage from "./EconomicoPage";
import DescobrirPage from "./DescobrirPage";
import RestaurantesPage from "./RestaurantesPage";
import HistoricoPage from "./HistoricoPage";
import BuscarPage from "./BuscarPage";
import ContatoPage from "./ContatoPage";
import AvaliarPage from "./AvaliarPage";
import NotFound from "./NotFound";

export default function AppLayout() {
  const { history, addEntry, clearHistory } = useHistory();

  const handleChoose = (food: Food) => addEntry(food);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <Routes>
        <Route path="/" element={<HomePage onChoose={handleChoose} />} />
        <Route path="/economico" element={<EconomicoPage />} />
        <Route path="/descobrir" element={<DescobrirPage />} />
        <Route path="/buscar" element={<BuscarPage />} />
        <Route path="/restaurantes" element={<RestaurantesPage />} />
        <Route path="/historico" element={<HistoricoPage history={history} onClear={clearHistory} />} />
        <Route path="/contato" element={<ContatoPage />} />
        <Route path="/avaliar" element={<AvaliarPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomTabs />
      <InstallPrompt />
    </div>
  );
}
