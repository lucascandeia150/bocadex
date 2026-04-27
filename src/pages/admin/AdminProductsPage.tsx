import AdminProductsTab from "@/components/admin/AdminProductsTab";
import AdminCategoriesTab from "@/components/admin/AdminCategoriesTab";
import { useState } from "react";
import { Package, Tag } from "lucide-react";

export default function AdminProductsPage() {
  const [tab, setTab] = useState<"products" | "categories">("products");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-foreground">Produtos</h1>
        <p className="text-sm text-muted-foreground">Gerencie produtos e categorias do app.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setTab("products")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "products" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}><Package size={14} /> Produtos</button>
        <button onClick={() => setTab("categories")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === "categories" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}><Tag size={14} /> Categorias</button>
      </div>
      <div className="bg-card border border-border rounded-2xl p-4">
        {tab === "products" ? <AdminProductsTab onRefresh={() => {}} /> : <AdminCategoriesTab onRefresh={() => {}} />}
      </div>
    </div>
  );
}