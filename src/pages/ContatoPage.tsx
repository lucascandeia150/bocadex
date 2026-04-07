import { Mail, Handshake, HelpCircle, Heart } from "lucide-react";
import logo from "@/assets/logo.png";
import { BackButton } from "@/components/BackButton";

export default function ContatoPage() {
  return (
    <div className="flex flex-col items-center px-6 pt-8 pb-10 gap-6">
      <BackButton />
      <div className="text-center animate-bounce-in">
        <img src={logo} alt="EscolheAí" className="w-24 h-24 mx-auto mb-3 object-contain" />
        <h1 className="text-2xl font-black text-foreground">EscolheAí</h1>
        <p className="text-muted-foreground text-sm mt-1">Seu assistente de comida inteligente 🤖</p>
      </div>

      <div className="w-full max-w-sm space-y-4 animate-slide-up">
        {/* Sobre */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Sobre o app</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O EscolheAí ajuda você a decidir o que comer de forma rápida, inteligente e econômica. 
            Chega de indecisão na hora da fome! 🍽️
          </p>
        </div>

        {/* Contato */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={20} className="text-secondary" />
            <h2 className="text-lg font-bold text-foreground">Contato</h2>
          </div>
          <a
            href="mailto:escolheai.app@gmail.com"
            className="flex items-center gap-3 bg-secondary/10 rounded-xl p-4 active:scale-95 transition-transform"
          >
            <Mail size={18} className="text-secondary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">escolheai.app@gmail.com</p>
              <p className="text-xs text-muted-foreground">Suporte e dúvidas</p>
            </div>
          </a>
        </div>

        {/* Parcerias */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Handshake size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Parcerias comerciais</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            É dono de restaurante ou quer ser parceiro? Entre em contato conosco!
          </p>
          <a
            href="mailto:escolheai.app@gmail.com?subject=Parceria%20Comercial%20-%20EscolheAí"
            className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
          >
            <Handshake size={18} />
            Quero ser parceiro
          </a>
        </div>

        {/* Suporte */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle size={20} className="text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Suporte</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Teve algum problema ou tem sugestões? Mande um email pra gente — respondemos rápido! 💬
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        © 2026 EscolheAí — Feito com ❤️ para acabar com a indecisão
      </p>
    </div>
  );
}
