import { useState } from "react";
import { Handshake, Send, X } from "lucide-react";

const WHATSAPP_NUMBER = "5533998669482";

const businessTypes = ["Restaurante", "Bar", "Lanchonete", "Distribuidora", "Doceria", "Pizzaria", "Outro"];

export function PartnerReferralCard() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!name.trim() || !type) return;
    const msg = `📋 *Nova indicação de parceiro:*\n\n🏪 Nome: ${name.trim()}\n📂 Tipo: ${type}\n📱 WhatsApp: ${whatsapp.trim() || "Não informado"}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    setSent(true);
    setTimeout(() => { setSent(false); setOpen(false); setName(""); setType(""); setWhatsapp(""); }, 3000);
  };

  if (sent) {
    return (
      <div className="bg-card border-2 border-primary/30 rounded-2xl p-5 text-center animate-bounce-in">
        <span className="text-4xl block mb-2">🚀</span>
        <p className="text-sm font-bold text-foreground">Obrigado pela indicação!</p>
        <p className="text-xs text-muted-foreground mt-1">Vamos analisar e entrar em contato.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-card border-2 border-primary/20 rounded-2xl p-4 text-center active:scale-[0.97] transition-transform hover:border-primary/40 shadow-sm"
      >
        <p className="text-sm font-bold text-foreground mb-1">Conhece algum lugar bom? 😋</p>
        <p className="text-xs text-muted-foreground mb-3">Indique um parceiro e ajude o app crescer!</p>
        <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-bold text-xs px-4 py-2 rounded-full">
          <Handshake size={14} /> Indicar parceiro 🤝
        </span>
      </button>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-sm animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-foreground">Indicar parceiro 🤝</p>
        <button onClick={() => setOpen(false)} className="text-muted-foreground p-1">
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 100))}
          placeholder="Nome do estabelecimento"
          className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tipo de estabelecimento</option>
          {businessTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9+() -]/g, "").slice(0, 20))}
          placeholder="WhatsApp (opcional)"
          inputMode="tel"
          className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <button
          onClick={handleSend}
          disabled={!name.trim() || !type}
          className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:active:scale-100"
        >
          <Send size={16} /> Enviar indicação 📤
        </button>
      </div>
    </div>
  );
}
