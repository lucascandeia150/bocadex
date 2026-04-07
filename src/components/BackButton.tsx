import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function BackButton({ label = "Voltar" }: { label?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/")}
      className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-4 active:scale-95 transition-transform"
    >
      <ArrowLeft size={16} /> {label}
    </button>
  );
}
