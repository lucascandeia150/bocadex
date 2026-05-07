import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

const BUSINESS_TYPES = [
  "Restaurante", "Lanchonete", "Pizzaria", "Hamburgueria", "Açaí",
  "Doceria", "Padaria", "Mercado", "Bebidas", "Outros",
];

export default function AdminCreatePartnerDialog({ open, onOpenChange, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ name: string; pin: string } | null>(null);
  const [form, setForm] = useState({
    business_name: "",
    business_type: "Restaurante",
    owner_name: "",
    whatsapp: "",
    address: "",
    description: "",
    logo_url: "",
    promotions: "",
    plan: "monthly_990",
    uses_app_courier: false,
    is_featured: false,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.business_name.trim() || !form.whatsapp.trim() || !form.address.trim()) {
      toast.error("Preencha nome, WhatsApp e endereço");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_create_partner", {
      _business_name: form.business_name,
      _business_type: form.business_type,
      _owner_name: form.owner_name || null,
      _whatsapp: form.whatsapp,
      _address: form.address,
      _description: form.description,
      _logo_url: form.logo_url || null,
      _uses_app_courier: form.uses_app_courier,
      _is_featured: form.is_featured,
      _promotions: form.promotions || null,
      _plan: form.plan,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    const row: any = data;
    setCreated({ name: row.business_name, pin: row.access_pin });
    toast.success("Parceiro cadastrado");
    onCreated?.();
  };

  const reset = () => {
    setCreated(null);
    setForm({
      business_name: "", business_type: "Restaurante", owner_name: "", whatsapp: "",
      address: "", description: "", logo_url: "", promotions: "", plan: "monthly_990",
      uses_app_courier: false, is_featured: false,
    });
  };

  const close = () => { onOpenChange(false); setTimeout(reset, 200); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); else onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar parceiro manualmente</DialogTitle>
          <DialogDescription>
            Cria a loja já aprovada e ativa. O PIN gerado dá acesso ao painel da loja.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle2 className="mx-auto text-green-600" size={48} />
            <div>
              <p className="font-black text-lg">{created.name}</p>
              <p className="text-sm text-muted-foreground">Parceiro criado com sucesso!</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">PIN de acesso</p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-3xl font-black tracking-widest text-primary">{created.pin}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(created.pin); toast.success("PIN copiado"); }}
                  className="p-2 rounded-lg hover:bg-background"
                  title="Copiar"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Compartilhe este PIN com o parceiro. Ele entra em <code>/parceiro</code>.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={reset}>Cadastrar outro</Button>
              <Button onClick={close}>Concluir</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
              <Field label="Nome da loja *">
                <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} placeholder="Ex.: Burger King Centro" />
              </Field>
              <Field label="Categoria">
                <select value={form.business_type} onChange={(e) => set("business_type", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Responsável">
                <Input value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} placeholder="Nome do dono" />
              </Field>
              <Field label="WhatsApp *">
                <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="55339..." />
              </Field>
              <Field label="Endereço *" className="md:col-span-2">
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, bairro, cidade" />
              </Field>
              <Field label="Logo (URL)" className="md:col-span-2">
                <Input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Descrição" className="md:col-span-2">
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Breve descrição da loja" />
              </Field>
              <Field label="Promoções" className="md:col-span-2">
                <Textarea value={form.promotions} onChange={(e) => set("promotions", e.target.value)} rows={2} placeholder="Promoções iniciais (opcional)" />
              </Field>
              <Field label="Plano">
                <select value={form.plan} onChange={(e) => set("plan", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="monthly_990">Mensal R$ 9,90</option>
                  <option value="monthly_2990">Mensal R$ 29,90</option>
                  <option value="free">Grátis (cortesia)</option>
                </select>
              </Field>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 h-10">
                  <Label className="text-xs">Usa entregador do app</Label>
                  <Switch checked={form.uses_app_courier} onCheckedChange={(v) => set("uses_app_courier", v)} />
                </div>
                <div className="flex items-center justify-between gap-2 h-10">
                  <Label className="text-xs">Loja em destaque</Label>
                  <Switch checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={loading}>Cancelar</Button>
              <Button onClick={submit} disabled={loading}>{loading ? "Salvando..." : "Cadastrar parceiro"}</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}