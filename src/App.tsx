import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "./pages/AppLayout";
import NotFound from "./pages/NotFound";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import AdminStoresPage from "./pages/admin/AdminStoresPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminFinancePage from "./pages/admin/AdminFinancePage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminLogsPage from "./pages/admin/AdminLogsPage";
import AdminCouriersPage from "./pages/admin/AdminCouriersPage";
import AdminPushPage from "./pages/admin/AdminPushPage";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminZonesPage from "./pages/admin/AdminZonesPage";
import MaintenanceGate from "./components/MaintenanceGate";

const queryClient = new QueryClient({});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
          <MaintenanceGate>
          <Routes>
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrderDetailPage />} />
              <Route path="stores" element={<AdminStoresPage />} />
              <Route path="couriers" element={<AdminCouriersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="finance" element={<AdminFinancePage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="logs" element={<AdminLogsPage />} />
              <Route path="push" element={<AdminPushPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="zones" element={<AdminZonesPage />} />
            </Route>
            <Route path="/*" element={<AppLayout />} />
          </Routes>
          </MaintenanceGate>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
