---
name: Monetização e afiliados
description: Sistema de monetização com Amazon affiliate dinâmico (DB), AdSense placeholders e YouTube
type: feature
---
- Amazon affiliate tag: escolheai-20, base link: https://amzn.to/41sRMWn
- Links afiliados agora são gerenciados via tabela `affiliate_links` no banco de dados
- Admin pode CRUD links afiliados na aba "Afiliados" do painel admin
- `getAffiliateLink()` lê do DB com cache de 1min, fallback para hardcoded
- `preloadAffiliateLinks()` chamada no main.tsx para pré-carregar
- Cada ingrediente nas receitas tem botão "Amazon" com link afiliado automático
- AdSense: placeholders prontos (bottom, inline, recipe) — aguardando ca-pub ID
- YouTube: busca genérica por receita
- Analytics trackeia: buy_ingredients_click, buy_ingredient_click, recipe_video_click, more_options_click
