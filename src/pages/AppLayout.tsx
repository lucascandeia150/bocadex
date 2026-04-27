import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { InstallPrompt } from "@/components/InstallPrompt";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { AdBanner } from "@/components/AdBanner";
import { AppSidebar } from "@/components/AppSidebar";
import { CartFab } from "@/components/CartFab";
import { BottomNav } from "@/components/BottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ArrowLeft } from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import type { Food } from "@/data/foods";
import HomePage from "./HomePage";
import LojasPage from "./LojasPage";
import LojaDetalhePage from "./LojaDetalhePage";
import ParceiroDetalhePage from "./ParceiroDetalhePage";
import DescobrirPage from "./DescobrirPage";
import BebidasPage from "./BebidasPage";
import BuscarPage from "./BuscarPage";
import HistoricoPage from "./HistoricoPage";
import ContatoPage from "./ContatoPage";
import AvaliarPage from "./AvaliarPage";
import SobrePage from "./SobrePage";
import ReceitasPage from "./ReceitasPage";
import ParceirosPage from "./ParceirosPage";
import SejaParceiroPage from "./SejaParceiroPage";
import SejaEntregadorPage from "./SejaEntregadorPage";
import PortalLojaPage from "./PortalLojaPage";
import PortalEntregadorPage from "./PortalEntregadorPage";
import AcessoParceiroPage from "./AcessoParceiroPage";
import AdminLoginPage from "./AdminLoginPage";
import AdminDashboardPage from "./AdminDashboardPage";
import DescobrirHubPage from "./DescobrirHubPage";
import TrabalhePage from "./TrabalhePage";
import CarrinhoPage from "./CarrinhoPage";
import PedidosPage from "./PedidosPage";
import PerfilPage from "./PerfilPage";
import PagamentoRetornoPage from "./PagamentoRetornoPage";
import NotFound from "./NotFound";

export default function AppLayout() {
  const { history, addEntry, clearHistory } = useHistory();
  const handleChoose = (food: Food) => addEntry(food);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
          <AppHeader />

          <main className="flex-1 pb-24">
            <Routes>
              <Route path="/" element={<HomePage onChoose={handleChoose} />} />
              <Route path="/lojas" element={<LojasPage />} />
              <Route path="/loja/:id" element={<LojaDetalhePage />} />
              <Route path="/carrinho" element={<CarrinhoPage />} />
              <Route path="/pagamento/retorno" element={<PagamentoRetornoPage />} />
              <Route path="/pedidos" element={<PedidosPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/parceiro/:id" element={<ParceiroDetalhePage />} />
              <Route path="/descobrir-hub" element={<DescobrirHubPage />} />
              <Route path="/trabalhe" element={<TrabalhePage />} />
              <Route path="/descobrir" element={<DescobrirPage />} />
              <Route path="/bebidas" element={<BebidasPage />} />
              <Route path="/receitas" element={<ReceitasPage />} />
              <Route path="/buscar" element={<BuscarPage />} />
              <Route path="/historico" element={<HistoricoPage history={history} onClear={clearHistory} />} />
              <Route path="/contato" element={<ContatoPage />} />
              <Route path="/avaliar" element={<AvaliarPage />} />
              <Route path="/sobre" element={<SobrePage />} />
              {/* parceiros page removed - integrated into /lojas */}
              <Route path="/seja-parceiro" element={<SejaParceiroPage />} />
              <Route path="/seja-entregador" element={<SejaEntregadorPage />} />
              <Route path="/acesso-parceiro" element={<AcessoParceiroPage />} />
              <Route path="/portal/loja" element={<PortalLojaPage />} />
              <Route path="/portal/entregador" element={<PortalEntregadorPage />} />
              <Route path="/admin" element={<AdminLoginPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <div className="fixed bottom-14 left-0 right-0 z-40 max-w-lg mx-auto">
            <AdBanner placement="bottom" />
          </div>
        </div>
      </div>
      <CartFab />
      <WhatsAppFloat />
      <InstallPrompt />
      <BottomNav />
    </SidebarProvider>
  );
}

function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin/dashboard");

  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-14 flex items-center px-4 gap-2">
      <SidebarTrigger className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all" />
      {!isHome && (
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          aria-label="Voltar"
          className="h-10 px-3 rounded-full bg-muted hover:bg-accent text-foreground flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
          <span className="text-xs font-bold">Voltar</span>
        </button>
      )}
      <span className="text-base font-black text-foreground ml-auto">EscolheAí</span>
    </header>
  );
}
