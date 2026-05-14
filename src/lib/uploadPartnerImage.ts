import { supabase } from "@/integrations/supabase/client";
import { compressImage } from "@/lib/imageCompress";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export interface UploadOptions {
  folder: string;            // ex: `${partnerId}/products`
  maxSize?: number;          // px
  quality?: number;          // 0-1
  upsert?: boolean;
  onProgress?: (pct: number) => void;
}

export interface UploadResult { url: string; path: string; }

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function uploadPartnerImage(file: File, opts: UploadOptions): Promise<UploadResult> {
  if (!file) throw new Error("Nenhum arquivo selecionado");
  if (!ACCEPTED.includes(file.type)) throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  if (file.size > MAX_BYTES) throw new Error("Arquivo muito grande (máx 10MB).");

  opts.onProgress?.(10);
  const compressed = await compressImage(file, {
    maxSize: opts.maxSize ?? 1280,
    quality: opts.quality ?? 0.82,
  });
  opts.onProgress?.(40);

  const ext = "jpg";
  const path = `${opts.folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  let lastErr: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.storage
      .from("partner-images")
      .upload(path, compressed, {
        upsert: opts.upsert ?? false,
        contentType: compressed.type || "image/jpeg",
        cacheControl: "3600",
      });
    if (!error) {
      opts.onProgress?.(90);
      const { data } = supabase.storage.from("partner-images").getPublicUrl(path);
      opts.onProgress?.(100);
      return { url: data.publicUrl, path };
    }
    lastErr = error;
    const msg = (error.message || "").toLowerCase();
    // Não re-tenta erros de permissão
    if (msg.includes("row-level security") || msg.includes("not authorized") || msg.includes("permission")) {
      throw new Error("Sem permissão para enviar imagem. Faça login novamente no portal.");
    }
    if (msg.includes("duplicate") || msg.includes("exists")) {
      // gera novo path e tenta de novo
      continue;
    }
    await wait(400 * attempt);
  }
  throw new Error(`Falha no upload: ${lastErr?.message || "erro desconhecido"}`);
}
