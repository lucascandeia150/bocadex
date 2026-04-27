import { Construction } from "lucide-react";

export default function AdminPlaceholderPage({
  title, description,
}: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-10 text-center">
        <Construction className="mx-auto text-primary mb-3" size={36} />
        <p className="text-base font-bold text-foreground">Em construção</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Esta seção será entregue na próxima fase do redesign do painel administrativo.
        </p>
      </div>
    </div>
  );
}