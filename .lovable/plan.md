## Plano de correções — Bocadex Delivery's

Aplicar em fases pequenas, validando cada uma. Sem alterar Mercado Pago, autenticação, layout principal nem dados existentes.

---

### Fase 1 — Banner de notificações (UX rápido)
- Mover `PushPermissionBanner` para o topo (abaixo do header), em `AppLayout.tsx`.
- Adicionar botão "Fechar" e cooldown de 24h no `localStorage` (chave `push_banner_dismissed_until`).
- Garantir que FAB (`CartFab`, `WhatsAppFloat`) fique abaixo via `z-index` e não cubra o banner.
- Animação suave (slide-in-from-top), área clicável aumentada.

### Fase 2 — Controle de versão pelo admin
A tabela `app_versions` já existe (`version`, `changelog`, `is_current`). Estender com:
- `title` text, `force_update` boolean default false, `active` boolean default true.

Ajustes:
- Hook `useAppVersion`: filtrar `is_current = true AND active = true`; salvar `escolheai_seen_version` ao fechar; só dispara toast/modal uma vez por versão.
- `AdminVersionsTab`: campos para `title`, toggle `active`, toggle `force_update`.
- Modal de update obrigatório quando `force_update = true` (bloqueia uso até recarregar).

### Fase 3 — Pedidos pagos não aparecem para entregadores
Diagnóstico provável: `customer_create_delivery` cria com `prep_status = 'ready'` e `status='disponivel'`, mas o fluxo via Mercado Pago/webhook pode estar criando com `prep_status='pending'` ou sem `is_open` validado. Verificar `mp-webhook` e garantir que após `approved`:
1. `payment.status = 'approved'`
2. Cria `delivery` com `status='disponivel'`, `prep_status='ready'` (cliente já pagou)
3. Realtime: habilitar publicação `supabase_realtime` na tabela `deliveries` (se ainda não estiver) e o `CourierDashboard` se inscrever em `postgres_changes`.
4. Logs em `admin_audit_logs` com action `delivery.created_from_payment`.

### Fase 4 — Push real (FCM) por evento
Já existe `send-push`. Adicionar gatilhos:
- No `mp-webhook` após criar entrega: push para loja ("Novo pedido pago"), push para todos os entregadores online ("Nova entrega disponível").
- Em `partner_advance_prep` / `partner_advance_delivery_status` / `courier_update_delivery`: chamar `send-push` para o cliente (`user_id` da delivery) com título conforme estado (`em preparo`, `saiu para entrega`, `entregue`).
- Garantir `data.click_url` para deep link (`/pedidos`, `/portal/loja`, `/portal/entregador`).
- SW `firebase-messaging-sw.js` já trata click — manter.

Implementação: criar trigger SQL em `deliveries` (AFTER UPDATE/INSERT) que chama edge function `notify-delivery-event` via `pg_net`, ou chamar `send-push` direto das RPCs (mais simples e síncrono — preferido).

### Fase 5 — Presença online do entregador
Adicionar em `couriers`:
- `is_online` boolean default false
- `last_seen_at` timestamptz

RPCs novas:
- `courier_set_online(_pin, _online)` → atualiza `is_online`/`last_seen_at`
- `courier_heartbeat(_pin)` → atualiza só `last_seen_at`

Cron job a cada 2 min: marca offline quem `last_seen_at < now() - 5 min`.

UI `CourierDashboard`: toggle Online/Offline, heartbeat a cada 60s enquanto aberto.

Push para entregadores (Fase 4) filtra `is_online = true`.

### Fase 6 — Entregador demo
- Inserir/garantir courier demo com `access_pin = '00000000'`, `name='Entregador Demo'`, `is_active=true`, `is_online=false`.
- Adicionar página admin `AdminCouriersManagePage` (lista + editar + reset PIN + ativar/desativar + ver status online). Usar RPCs novas: `admin_reset_courier_pin`, `admin_toggle_courier_active`.

### Fase 7 — Polimento visual
- Z-index review: header(50) > banner topo(45) > FAB(40) > bottom nav(30) > ad(20).
- Áreas clicáveis mín. 44px nos botões críticos (banner, toggle online, reenviar push).

### Fase 8 — Validação
- Testar fluxo cliente→pago→entregador via curl no `mp-webhook` simulado.
- Verificar realtime no `CourierDashboard`.
- Ler logs de `send-push` e `mp-webhook`.

---

### Migrações SQL necessárias
```sql
ALTER TABLE app_versions
  ADD COLUMN IF NOT EXISTS title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS force_update boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

ALTER PUBLICATION supabase_realtime ADD TABLE deliveries;
-- + RPCs courier_set_online/heartbeat, admin_reset_courier_pin, admin_toggle_courier_active
-- + cron job 2min para marcar offline
```

### Edge functions tocadas
- `mp-webhook`: após criar delivery, chamar `send-push` (loja + entregadores online).
- Nova: nenhuma obrigatória; reuso de `send-push`.

### Confirmações antes de começar
1. Posso adicionar a coluna `title`/`force_update`/`active` em `app_versions` (não afeta dados atuais — defaults seguros)?
2. Posso adicionar `is_online`/`last_seen_at` em `couriers` e habilitar realtime em `deliveries`?
3. Sobre o "WhatsApp opcional" para entregador — deixo desligado por padrão (apenas push), ok?

Confirma para eu seguir, ou quer recortar alguma fase?