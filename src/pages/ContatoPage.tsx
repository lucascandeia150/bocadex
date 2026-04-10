import { useState } from "react";
import { Mail, Handshake, HelpCircle, Heart, Send, MessageSquare, Lightbulb, Store } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";

export default function ContatoPage() {
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Escreva uma mensagem antes de enviar 😉");
      return;
    }
    setSending(true);
    try {
      await supabase.functions.invoke("send-feedback", {
        body: { type: "contato", name, email, message },
      });
      toast.success("Mensagem enviada com sucesso! 🙌 Em breve entraremos em contato.");
      setMessage("");
      setName("");
      setEmail("");
    } catch {
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 pt-8 pb-10 gap-5">
      <BackButton />
      <div className="text-center animate-bounce-in">
        <img src={logo} alt="EscolheAí" className="w-20 h-20 mx-auto mb-2 object-contain drop-shadow-lg" />
        <h1 className="text-2xl font-black text-foreground">Fale com a gente 📩</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Parcerias, suporte ou dúvidas? Entre em contato com a gente.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4 animate-slide-up">
        {/* O que fazemos */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Sobre o EscolheAí</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O EscolheAí conecta você às melhores opções de comida de forma rápida e prática.
            Chega de indecisão na hora da fome! 🍽️
          </p>
        </div>

        {/* WhatsApp */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={20} className="text-[hsl(142,70%,45%)]" />
            <h2 className="text-lg font-bold text-foreground">WhatsApp</h2>
          </div>
          <a
            href="https://wa.me/5533998669482?text=Ol%C3%A1!%20Entrei%20em%20contato%20pelo%20app%20EscolheA%C3%AD%20%F0%9F%98%84"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md mb-3"
          >
            <MessageSquare size={18} />
            Falar no WhatsApp 💬
          </a>
        </div>

        {/* Email */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={20} className="text-secondary" />
            <h2 className="text-lg font-bold text-foreground">Email</h2>
          </div>
          <a
            href="mailto:escolheai.app@gmail.com"
            className="flex items-center gap-3 bg-secondary/10 rounded-xl p-4 active:scale-95 transition-transform"
          >
            <Mail size={18} className="text-secondary shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">escolheai.app@gmail.com</p>
              <p className="text-xs text-muted-foreground">Suporte, dúvidas e parcerias</p>
            </div>
          </a>
        </div>

        {/* O canal serve para */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-3">Nossos canais servem para:</h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <HelpCircle size={16} className="text-primary mt-0.5 shrink-0" />
              <span>Suporte ao usuário</span>
            </li>
            <li className="flex items-start gap-2">
              <Store size={16} className="text-primary mt-0.5 shrink-0" />
              <span>Parcerias com restaurantes e lanchonetes</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb size={16} className="text-primary mt-0.5 shrink-0" />
              <span>Sugestões de melhorias</span>
            </li>
          </ul>
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
            href="https://wa.me/5533998669482?text=Ol%C3%A1!%20Tenho%20interesse%20em%20ser%20parceiro%20do%20EscolheA%C3%AD%20%F0%9F%A4%9D"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Handshake size={18} />
            Quero ser parceiro 🤝
          </a>
        </div>

        {/* Formulário de mensagem */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={20} className="text-secondary" />
            <h2 className="text-lg font-bold text-foreground">Enviar mensagem</h2>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome (opcional)"
              className="w-full bg-muted rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email (opcional)"
              className="w-full bg-muted rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              rows={4}
              className="w-full bg-muted rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full gradient-primary text-primary-foreground font-bold py-3.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
            >
              <Send size={18} />
              {sending ? "Enviando..." : "Enviar mensagem"}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-4">
        © 2026 EscolheAí — Feito com ❤️ para acabar com a indecisão
      </p>
    </div>
  );
}
