## Visão geral

Sua solicitação é gigantesca (essencialmente reconstruir grande parte do app). Para garantir a regra #1 — **não quebrar nada** — vou executar em **fases pequenas e validáveis**, não tudo de uma vez. Cada fase é independente e pode ser testada antes de seguir.

Abaixo está a proposta. Me confirme por onde começar (ou diga "fase 1" para eu começar pelo rebrand).

---

## Fase 1 — Rebrand global "Bocadex" → "Bocadex Delivery's" ⚡ rápida e segura

- `index.html`: title, meta description, og/twitter, apple-mobile-web-app-title
- `public/manifest.json`: name, short_name, description
- Strings visíveis: sidebar admin, splash, loadings, headers, e-mails das edge functions, mensagens de notificação push
- Mantém rotas, IDs, tabelas, integrações intactas (só texto exibido)

**Risco**: nenhum. Só strings.

---

## Fase 2 — Entregador Demo

- Migration: insere 1 `couriers` demo (vehicle=moto, is_active=true, access_pin gerado, flag `is_demo`)
- Aparece no painel admin de entregadores
- Pode receber push (token registrado quando logar)

---

## Fase 3 — Admin: cadastro manual de parceiro

- Nova página `/admin/dashboard/stores/novo`
- Form com todos os campos (nome, responsável, contato, CPF/CNPJ, endereço, categoria, taxa, comissão, plano, logo, banner, senha, observações, promoções)
- RPC `admin_create_partner` (SECURITY DEFINER, só admin) que cria `partner_applications` já aprovado + opcionalmente cria conta auth via edge function
- Credenciais exibidas no fim para o admin copiar

---

## Fase 4 — Dashboard admin avançado

- Cards: pedidos hoje / em andamento / cancelados, faturamento dia/mês, lucro plataforma, entregadores online, lojas online, clientes ativos
- Gráfico (recharts) últimos 7 dias
- Mapa entregadores online (Mapbox — token já existe)
- **Sem remover** a `AdminOverviewPage` atual; expando dentro dela

---

## Fase 5 — Gestão avançada de lojas

- Adiciona ações na lista existente: pausar / bloquear / destacar / editar comissão / resetar senha / ativar entrega própria
- Coluna `store_status` (ativa/pausada/bloqueada/em_análise) — derivada de campos existentes (`is_active`, `status`, `is_open`) para não migrar dado

---

## Fase 6 — Painel loja: melhorias

- Som alto em novo pedido (Web Audio loop até interagir)
- Aba financeiro / relatórios / cupons / banner promocional
- Modo pausa rápido

---

## Fase 7 — Painel entregador profissional

- Toggle online/offline (campo novo `is_online` em `couriers`)
- Tela ganhos / histórico / ranking
- Foto perfil, tipo veículo, chave PIX (campos novos opcionais)
- Mapa com entrega ativa

---

## Fase 8 — Notificações automáticas + WhatsApp para entregadores

- Triggers/edge functions disparam push em transições de status (`disponivel` → cliente, novo pedido → loja, `ready` → entregadores online da região)
- WhatsApp: link `wa.me` automático via edge function (sem custo) OU integração WhatsApp Business API se quiser oficial (precisa secret)
- Anti-spam: dedupe por delivery_id + cooldown 5min

---

## Fase 9 — Central admin (cupons, campanhas, suporte, configs globais)

- Tabelas novas: `coupons`, `campaigns`, `support_tickets`
- Páginas admin correspondentes

---

## Fase 10 — Polish design + Home + PWA Play Store ready

- Refino visual cards/sombras
- Home: banner, categorias, destaques, promoções, últimas compras
- Splash screens iOS, ícones maskable, lighthouse

---

## Recomendação

Faço **Fase 1 + Fase 2 + Fase 3 agora** num único passo (são as mais pedidas e seguras). Depois você valida e seguimos.

Confirma?