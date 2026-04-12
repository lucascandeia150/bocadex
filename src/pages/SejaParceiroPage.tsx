import { CheckCircle, Rocket, MessageCircle } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/trackEvent";

const KIRVANO_LINK = "https://pay.kirvano.com/8ff4d99e-75f8-4202-80af-e2ef2851b418";
const WHATSAPP_NUMBER = "5533998669482";

const benefits = [
  "Divulgação dentro do app",
  "Até 3 postagens diárias no Instagram (reels e stories)",
  "Mais visibilidade local",
  "Aumento de pedidos e vendas",
];

export default function SejaParceiroPage() {
  const handlePayment = () => {
    trackAnalyticsEvent("partner_payment_click", { source: "seja_parceiro_page" });
    window.open(KIRVANO_LINK, "_blank");
  };

  const handleIndicate = () => {
    trackAnalyticsEvent("partner_indicate_click", { source: "seja_parceiro_page" });
    const msg = encodeURIComponent("Olá! Quero indicar um estabelecimento para entrar no app EscolheAí");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
  };

  return (
    <div className="px-4 pt-6 pb-12 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 animate-bounce-in">
        <span className="text-5xl block">🔥</span>
        <h1 className="text-2xl font-black text-foreground">Seja parceiro do EscolheAí</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Divulgue seu negócio no app e nas redes sociais e alcance mais clientes todos os dias!
        </p>
      </div>

      {/* Benefits */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3 animate-slide-up">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">O que você ganha:</h2>
        {benefits.map((b) => (
          <div key={b} className="flex items-start gap-2.5">
            <CheckCircle size={18} className="text-primary mt-0.5 shrink-0" />
            <span className="text-sm font-semibold text-foreground">{b}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="bg-card border-2 border-secondary/40 rounded-2xl p-5 text-center space-y-3 animate-slide-up" style={{ animationDelay: "50ms" }}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Oferta promocional 🎉</p>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm line-through">R$ 29,90/mês</p>
          <p className="text-3xl font-black text-secondary">R$ 9,90<span className="text-base font-bold text-muted-foreground">/mês</span></p>
        </div>
        <p className="text-[11px] text-muted-foreground">⏳ Por tempo limitado!</p>
      </div>

      {/* CTA Button */}
      <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
        <button
          onClick={handlePayment}
          className="w-full gradient-primary text-primary-foreground font-black text-lg py-5 rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Rocket size={22} /> Quero aproveitar agora 🚀
        </button>
      </div>

      {/* Post-payment info */}
      <div className="bg-accent/50 rounded-2xl p-4 text-center animate-slide-up" style={{ animationDelay: "150ms" }}>
        <p className="text-xs text-accent-foreground font-semibold leading-relaxed">
          ✅ Após o pagamento, entraremos em contato via WhatsApp para ativar seu perfil no app!
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-bold">ou</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Indicate partner */}
      <button
        onClick={handleIndicate}
        className="w-full bg-card border-2 border-primary/20 rounded-2xl p-4 text-center active:scale-[0.97] transition-transform hover:border-primary/40 shadow-sm"
      >
        <p className="text-sm font-bold text-foreground mb-1">Conhece algum lugar bom? 😋</p>
        <p className="text-xs text-muted-foreground mb-3">Indique um parceiro via WhatsApp!</p>
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-bold text-xs px-4 py-2 rounded-full">
          <MessageCircle size={14} /> Indicar parceiro 🤝
        </span>
      </button>
    </div>
  );
}
