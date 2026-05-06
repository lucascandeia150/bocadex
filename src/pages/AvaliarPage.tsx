import { useState } from "react";
import { Star, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

const quickOptions = [
  { label: "Fácil de usar 👍", value: "facil" },
  { label: "Me ajudou a decidir 🤝", value: "ajudou" },
  { label: "Economizei dinheiro 💰", value: "economizei" },
  { label: "Pode melhorar ⚠️", value: "melhorar" },
];

export default function AvaliarPage() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const toggleOption = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma nota de 1 a 5 estrelas ⭐");
      return;
    }

    setSending(true);

    const selectedLabels = quickOptions
      .filter((o) => selected.includes(o.value))
      .map((o) => o.label)
      .join(", ");

    const body = {
      rating,
      comment: comment.trim().slice(0, 1000),
      options: selectedLabels || "Nenhuma",
    };

    try {
      const { data, error } = await supabase.functions.invoke("send-feedback", { body });
      
      if (error) throw error;
      
      const result = data as { success?: boolean; error?: string };
      if (result?.success) {
        setSent(true);
      } else {
        // Fallback: open email
        openEmailFallback(body);
      }
    } catch {
      // Fallback: open email
      openEmailFallback(body);
    } finally {
      setSending(false);
    }
  };

  const openEmailFallback = (body: { rating: number; comment: string; options: string }) => {
    const subject = encodeURIComponent("Nova avaliação do app Bocadex");
    const emailBody = encodeURIComponent(
      `Nota: ${"⭐".repeat(body.rating)} (${body.rating}/5)\nOpções: ${body.options}\nComentário: ${body.comment || "(sem comentário)"}\n\nEnviado pelo Bocadex`
    );
    window.open(`mailto:escolheai.app@gmail.com?subject=${subject}&body=${emailBody}`, "_blank");
    setSent(true);
    toast.info("Abrindo seu email para enviar a avaliação 📧");
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 gap-6 animate-bounce-in">
        <CheckCircle size={64} className="text-primary" />
        <h2 className="text-2xl font-black text-foreground text-center">
          Obrigado pelo seu feedback! 🙌
        </h2>
        <p className="text-muted-foreground text-sm text-center">
          Sua opinião nos ajuda a melhorar o Bocadex todos os dias ❤️
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 pt-8 pb-10 gap-6">
      
      <div className="text-center animate-bounce-in">
        <img src={logo} alt="Bocadex" className="w-20 h-20 mx-auto mb-2 object-contain" />
        <h1 className="text-2xl font-black text-foreground">Avaliar app ⭐</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sua opinião é super importante pra gente!
        </p>
      </div>

      <div className="w-full max-w-sm space-y-5 animate-slide-up">
        {/* Stars */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm text-center">
          <p className="text-sm font-bold text-foreground mb-3">Como você avalia o app?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                className="active:scale-90 transition-transform"
              >
                <Star
                  size={36}
                  className={
                    s <= (hoverRating || rating)
                      ? "fill-secondary text-secondary"
                      : "text-muted-foreground/30"
                  }
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {rating <= 2 ? "Vamos melhorar! 💪" : rating <= 4 ? "Valeu! 😊" : "Incrível! 🎉"}
            </p>
          )}
        </div>

        {/* Quick options */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm font-bold text-foreground mb-3">O que mais gostou?</p>
          <div className="flex flex-wrap gap-2">
            {quickOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleOption(opt.value)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  selected.includes(opt.value)
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-sm font-bold text-foreground mb-3">Comentário (opcional)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Diga o que você achou ou como podemos melhorar..."
            maxLength={1000}
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={sending}
          className="w-full gradient-primary text-primary-foreground font-black text-base py-4 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Send size={18} />
          {sending ? "Enviando..." : "Enviar avaliação"}
        </button>
      </div>
    </div>
  );
}
