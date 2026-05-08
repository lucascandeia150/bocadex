import { Shield, FileText, Lock, Mail, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacidadePage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-sm mx-auto px-4 pt-6 pb-32 animate-slide-up">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
          <Shield size={26} className="text-primary" />
        </div>
        <h1 className="text-xl font-black text-foreground">Privacidade & Termos</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Seus dados estão protegidos conforme a LGPD.
        </p>
      </div>

      <Section icon={FileText} title="Política de Privacidade">
        Coletamos apenas os dados necessários para o funcionamento do app: nome,
        email, telefone, endereço de entrega e histórico de pedidos. Não vendemos
        nem compartilhamos seus dados com terceiros para fins de marketing.
      </Section>

      <Section icon={FileText} title="Termos de Uso">
        Ao usar o Bocadex Delivery's você concorda em fornecer informações
        verdadeiras, respeitar lojas e entregadores parceiros e utilizar o app
        apenas para fins legítimos de pedido e entrega de alimentos.
      </Section>

      <Section icon={Lock} title="LGPD — Lei Geral de Proteção de Dados">
        Você pode solicitar a qualquer momento o acesso, correção ou exclusão
        dos seus dados pessoais. Os pedidos são tratados em até 15 dias úteis.
        Para exercer seus direitos, entre em contato pelo suporte.
      </Section>

      <div className="bg-card border border-border rounded-2xl p-4 mt-4">
        <p className="text-sm font-bold text-foreground mb-3">Contato do Suporte</p>
        <a
          href="mailto:escolheai.app@gmail.com"
          className="flex items-center gap-2 text-sm text-foreground py-2"
        >
          <Mail size={16} className="text-primary" /> escolheai.app@gmail.com
        </a>
        <button
          onClick={() => navigate("/contato")}
          className="w-full mt-2 bg-primary text-primary-foreground font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <MessageCircle size={16} /> Falar com o suporte
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-6">
        Última atualização: maio de 2026
      </p>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Shield;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-primary" />
        <h2 className="text-sm font-black text-foreground">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}