import { Routes, Route } from "react-router-dom";
import { InstallPrompt } from "@/components/InstallPrompt";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { AdBanner } from "@/components/AdBanner";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
import SobrePage from "./SobrePage";
import ReceitasPage from "./ReceitasPage";
import AdminLoginPage from "./AdminLoginPage";
import AdminDashboardPage from "./AdminDashboardPage";
import NotFound from "./NotFound";

export default function AppLayout() {
  const { history, addEntry, clearHistory } = useHistory();
  const handleChoose = (food: Food) => addEntry(food);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-14 flex items-center px-4 gap-3">
            <SidebarTrigger className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all animate-pulse [animation-iteration-count:2] [animation-duration:1.5s]" />
            <span className="text-xs font-bold text-primary">Menu</span>
            <span className="text-base font-black text-foreground ml-auto">EscolheAí</span>
          </header>

          <main className="flex-1 pb-8">
            <Routes>
              <Route path="/" element={<HomePage onChoose={handleChoose} />} />
              <Route path="/lojas" element={<LojasPage />} />
              <Route path="/loja/:id" element={<LojaDetalhePage />} />
              <Route path="/descobrir" element={<DescobrirPage />} />
              <Route path="/bebidas" element={<BebidasPage />} />
              <Route path="/receitas" element={<ReceitasPage />} />
              <Route path="/buscar" element={<BuscarPage />} />
              <Route path="/historico" element={<HistoricoPage history={history} onClear={clearHistory} />} />
              <Route path="/contato" element={<ContatoPage />} />
              <Route path="/avaliar" element={<AvaliarPage />} />
              <Route path="/sobre" element={<SobrePage />} />
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <div className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto">
            <AdBanner placement="bottom" />
          </div>
        </div>
      </div>
      <WhatsAppFloat />
      <InstallPrompt />
    </SidebarProvider>
  );
}
