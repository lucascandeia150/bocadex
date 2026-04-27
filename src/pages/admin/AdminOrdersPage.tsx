import AdminDeliveriesTab from "@/components/admin/AdminDeliveriesTab";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Lista completa de entregas · atualiza em tempo real</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        <AdminDeliveriesTab />
      </div>
    </div>
  );
}