import { Routes, Route } from "react-router-dom";
import { InstallPrompt } from "@/components/InstallPrompt";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { AdBanner } from "@/components/AdBanner";
import { useHistory } from "@/hooks/useHistory";
import type { Food } from "@/data/foods";
import HomePage from "./HomePage";
import LojasPage from "./LojasPage";
import LojaDetalhePage from "./LojaDetalhePage";
import DescobrirPage from "./DescobrirPage";
import BebidasPage from "./BebidasPage";
import BuscarPage from "./BuscarPage";
import HistoricoPage from "./HistoricoPage";
import ContatoPage from "./ContatoPage";
import AvaliarPage from "./AvaliarPage";
import AdminLoginPage from "./AdminLoginPage";
import AdminDashboardPage from "./AdminDashboardPage";
import NotFound from "./NotFound";

export default function AppLayout() {
  const { history, addEntry, clearHistory } = useHistory();
  const handleChoose = (food: Food) => addEntry(food);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-8">
      <Routes>
        <Route path="/" element={<HomePage onChoose={handleChoose} />} />
        <Route path="/lojas" element={<LojasPage />} />
        <Route path="/loja/:id" element={<LojaDetalhePage />} />
        <Route path="/descobrir" element={<DescobrirPage />} />
        <Route path="/bebidas" element={<BebidasPage />} />
        <Route path="/buscar" element={<BuscarPage />} />
        <Route path="/historico" element={<HistoricoPage history={history} onClear={clearHistory} />} />
        <Route path="/contato" element={<ContatoPage />} />
        <Route path="/avaliar" element={<AvaliarPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto">
        <AdBanner placement="bottom" />
      </div>
      <WhatsAppFloat />
      <InstallPrompt />
    </div>
  );
}
