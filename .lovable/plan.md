## Objetivo
Reorganizar a página de cada loja em seções (Destaques, Promoções, Categorias) com menu fixo horizontal, e dar ao parceiro controle total sobre categorias, destaques, ordem e preço promocional.

## Backend (migration única)

**Nova tabela `partner_categories`** (categorias por loja):
- `id`, `partner_id`, `name`, `icon` (emoji), `image_url`, `display_order`, `is_active`, `created_at`, `updated_at`
- RLS: público lê ativas; parceiro (`current_partner_id()`) faz CRUD; admin tudo.

**Tabela `products` — novas colunas**:
- `partner_category_id uuid` (referência opcional à categoria da loja)
- `is_featured boolean default false`
- `original_price numeric` (preço "de", riscado, quando em promo)
- `display_order int default 0`

**RPCs** (security definer, validam PIN via `current_partner_id`):
- `partner_list_categories(_pin)`
- `partner_create_category(_pin, _name, _icon, _image_url)`
- `partner_update_category(_pin, _id, _name, _icon, _image_url, _display_order, _is_active)`
- `partner_delete_category(_pin, _id)` (move produtos para `null`)
- Atualizar `partner_create_product` / `partner_update_product` para aceitar `_partner_category_id`, `_is_featured`, `_original_price`, `_display_order`
- `partner_reorder_products(_pin, _orders jsonb)` — `[{id, order}, ...]`

## Frontend cliente — `ParceiroDetalhePage.tsx`

- Buscar `partner_categories` ativas + produtos com novos campos.
- **Menu fixo horizontal** (sticky abaixo do header) com chips: `⭐ Destaques`, `🔥 Promos`, depois categorias da loja. Clique faz scroll suave até a seção. Categoria ativa destacada conforme scroll (IntersectionObserver).
- **Seção Destaques** ⭐: carrossel horizontal com cards maiores quando há `is_featured`.
- **Seção Promoções** 🔥: produtos com `original_price > price_min`, selo "PROMO", preço antigo riscado.
- **Seções por categoria**: agrupar produtos por `partner_category_id`; categorias vazias ocultas.
- **Sem categoria**: seção "Outros" no fim (só se houver itens).
- Cards refinados: imagem maior, nome, descrição, preço destacado (com riscado quando promo), badge ⭐/🔥, botão `+` discreto.
- `loading="lazy"` em todas as imagens.

## Frontend parceiro — `PortalLojaPage.tsx`

- **Nova aba "Categorias"** (`PartnerCategoriesTab.tsx`): listar/criar/editar/excluir/reordenar (botões ↑↓), upload de imagem opcional + emoji.
- **`PartnerProductsTab.tsx`** atualizado:
  - Seletor de categoria agora usa `partner_categories` da loja (não a tabela global).
  - Toggle ⭐ "Destaque" e 🔥 "Em promoção" (mostra campo "preço de" = `original_price`).
  - Filtro/agrupamento visual por categoria + indicador de destaque/promo no card.
  - Botões ↑↓ para `display_order`.

## Detalhes técnicos

- Categoria global existente (`categories`) permanece intocada (admin/legado). Produtos passam a usar prioritariamente `partner_category_id`.
- IntersectionObserver para sincronizar chip ativo durante scroll; chips em `flex overflow-x-auto snap-x` com posição `sticky top-0 z-30 bg-background/95 backdrop-blur`.
- Carrossel de destaques: `flex overflow-x-auto snap-x snap-mandatory` com cards `w-64`.
- Promoção: `is_promo` derivado (`original_price != null && original_price > price_min`); selo `bg-secondary text-secondary-foreground`.
- Reordenação: simplificar com botões ↑↓ (sem drag-and-drop nesta fase para manter mobile robusto).

## Arquivos
- **Migration nova**: tabela + colunas + RPCs.
- **Novo**: `src/components/portal/PartnerCategoriesTab.tsx`.
- **Editar**: `src/pages/ParceiroDetalhePage.tsx`, `src/components/portal/PartnerProductsTab.tsx`, `src/pages/PortalLojaPage.tsx` (adicionar a aba).

## Não quebrar
- Pedidos, Mercado Pago, carrinho, checkout, financeiro permanecem inalterados.
- Produtos antigos sem categoria continuam visíveis na seção "Outros".
