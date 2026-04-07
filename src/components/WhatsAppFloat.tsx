import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  const handleClick = () => {
    const message = encodeURIComponent("Olá! Entrei em contato pelo app EscolheAí 😄");
    window.open(`https://wa.me/5533998669482?text=${message}`, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Falar no WhatsApp"
      className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white shadow-lg active:scale-90 transition-all flex items-center justify-center animate-bounce-in"
    >
      <MessageCircle size={26} fill="white" strokeWidth={0} />
    </button>
  );
}
