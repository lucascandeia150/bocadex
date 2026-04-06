import { Routes, Route } from "react-router-dom";
import { BottomTabs } from "@/components/BottomTabs";
import { useHistory } from "@/hooks/useHistory";
import type { Food } from "@/data/foods";
import HomePage from "./HomePage";
import EconomicoPage from "./EconomicoPage";
import SugestoesPage from "./SugestoesPage";
import HistoricoPage from "./HistoricoPage";
import ContatoPage from "./ContatoPage";
import NotFound from "./NotFound";

export default function AppLayout() {
  const { history, addEntry, clearHistory } = useHistory();

  const handleChoose = (food: Food) => addEntry(food);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <Routes>
        <Route path="/" element={<HomePage onChoose={handleChoose} />} />
        <Route path="/economico" element={<EconomicoPage />} />
        <Route path="/sugestoes" element={<SugestoesPage onChoose={handleChoose} />} />
        <Route path="/historico" element={<HistoricoPage history={history} onClear={clearHistory} />} />
        <Route path="/contato" element={<ContatoPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomTabs />
    </div>
  );
}
