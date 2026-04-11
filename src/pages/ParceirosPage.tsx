import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Handshake, Upload, Send, CheckCircle } from "lucide-react";

const WHATSAPP_NUMBER = "5533998669482";

const businessTypes = [
  "Distribuidora",
  "Doces e Sobremesas",
  "Lanches e Hambúrgueres",
  "Restaurante",
  "Pizzaria",
  "Açaí e Sorvetes",
  "Padaria",
  "Outro",
];

export default function ParceirosPage() {
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    address: "",
    description: "",
    whatsapp: "",
    promotions: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const validate = () => {
    const required = ["businessName", "businessType", "address", "description", "whatsapp"] as const;
    for (const field of required) {
      if (!form[field].trim()) {
        toast({ title: "Campo obrigatório", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("partner-images").upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from("partner-images").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      // Save to database
      const { error: dbError } = await supabase.from("partner_applications").insert({
        business_name: form.businessName,
        business_type: form.businessType,
        address: form.address,
        description: form.description,
        whatsapp: form.whatsapp,
        promotions: form.promotions || null,
        images: imageUrls,
      });

      if (dbError) throw dbError;

      // Send to WhatsApp
      const msg = encodeURIComponent(
        `🤝 *Novo parceiro interessado:*\n\n` +
        `📌 *Nome:* ${form.businessName}\n` +
        `🏷️ *Tipo:* ${form.businessType}\n` +
        `📍 *Endereço:* ${form.address}\n` +
        `📝 *Descrição:* ${form.description}\n` +
        `📱 *WhatsApp:* ${form.whatsapp}\n` +
        (form.promotions ? `🎉 *Promoções:* ${form.promotions}\n` : "") +
        `📷 *Imagens:* ${imageUrls.length} enviada(s)\n\n` +
        `Acessar app para revisar imagens e finalizar cadastro.`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");

      setSent(true);
      toast({ title: "Cadastro enviado! 🚀", description: "Em breve entraremos em contato pelo WhatsApp." });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <CheckCircle className="h-16 w-16 text-primary" />
        <h2 className="text-2xl font-black">Cadastro enviado com sucesso! 🚀</h2>
        <p className="text-muted-foreground">Em breve entraremos em contato pelo WhatsApp.</p>
        <Button onClick={() => { setSent(false); setForm({ businessName: "", businessType: "", address: "", description: "", whatsapp: "", promotions: "" }); setImages([]); }}>
          Enviar outro cadastro
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-2">
        <Handshake className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-2xl font-black">Área do Parceiro 🤝</h1>
        <p className="text-sm text-muted-foreground">Cadastre seu estabelecimento e faça parte do EscolheAí!</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Nome do estabelecimento *</Label>
          <Input placeholder="Ex: Distribuidora do João" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
        </div>

        <div>
          <Label>Tipo de negócio *</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {businessTypes.map((type) => (
              <button
                key={type}
                onClick={() => update("businessType", type)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  form.businessType === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Endereço completo *</Label>
          <Input placeholder="Rua, número, bairro, cidade" value={form.address} onChange={(e) => update("address", e.target.value)} />
        </div>

        <div>
          <Label>Descrição do negócio *</Label>
          <Textarea placeholder="Conte um pouco sobre seu estabelecimento..." value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>

        <div>
          <Label>WhatsApp do parceiro *</Label>
          <Input placeholder="(00) 00000-0000" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
        </div>

        <div>
          <Label>Promoções (opcional)</Label>
          <Textarea placeholder="Descreva promoções ativas, se houver..." value={form.promotions} onChange={(e) => update("promotions", e.target.value)} />
        </div>

        <div>
          <Label>Imagens do local/produtos (até 5)</Label>
          <label className="mt-1 flex items-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-xl p-4 hover:border-primary transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {images.length > 0 ? `${images.length} imagem(ns) selecionada(s)` : "Clique para selecionar"}
            </span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          </label>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-base font-bold gap-2">
          <Send className="h-5 w-5" />
          {loading ? "Enviando..." : "🚀 Quero ser parceiro"}
        </Button>
      </div>
    </div>
  );
}
