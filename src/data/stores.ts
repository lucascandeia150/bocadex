export interface StoreReview {
  text: string;
  stars: number;
}

export interface StoreProduct {
  id: string;
  name: string;
  emoji: string;
  description: string;
  priceMin: number;
  priceMax: number;
  whatsappMessage: string;
}

export interface Store {
  id: string;
  name: string;
  emoji: string;
  category: StoreCategory;
  description: string;
  whatsapp: string;
  products: StoreProduct[];
  highlighted?: boolean;
  offer?: string;
  ingredients?: string[];
  reviews?: StoreReview[];
}

export type StoreCategory = "lanchonetes" | "pizzarias" | "restaurantes" | "cafes" | "doces";

export const categoryLabels: Record<StoreCategory, { label: string; emoji: string }> = {
  lanchonetes: { label: "Lanchonetes", emoji: "🍔" },
  pizzarias: { label: "Pizzarias", emoji: "🍕" },
  restaurantes: { label: "Restaurantes", emoji: "🍽️" },
  cafes: { label: "Cafés", emoji: "☕" },
  doces: { label: "Doces", emoji: "🍪" },
};

export const stores: Store[] = [
  {
    id: "biscoito-da-tete",
    name: "Biscoito da Tetê",
    emoji: "🍪",
    category: "doces",
    description: "🤤 Biscoitos caseiros que derretem na boca! Feitos com carinho e ingredientes selecionados 😋",
    whatsapp: "5573998719117",
    highlighted: true,
    offer: "🔥 3 potinhos por R$20,00",
    ingredients: ["Maisena", "Leite condensado desnatado", "Manteiga"],
    reviews: [
      { text: "Muito bom e fresquinho!", stars: 5 },
      { text: "Melhor biscoito da região!", stars: 5 },
      { text: "Minha família amou, já pedi de novo!", stars: 5 },
    ],
    products: [
      {
        id: "nata-tradicional",
        name: "Nata Tradicional",
        emoji: "🍪",
        description: "O clássico biscoito de nata, crocante por fora e macio por dentro",
        priceMin: 7,
        priceMax: 10,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o Nata Tradicional!",
      },
      {
        id: "goiabinha",
        name: "Goiabinha",
        emoji: "🍓",
        description: "Biscoito recheado com goiabada caseira",
        priceMin: 7,
        priceMax: 10,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre a Goiabinha!",
      },
      {
        id: "doce-de-leite",
        name: "Doce de Leite",
        emoji: "🥛",
        description: "Biscoito com recheio cremoso de doce de leite",
        priceMin: 7,
        priceMax: 10,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o de Doce de Leite!",
      },
      {
        id: "morango",
        name: "Morango",
        emoji: "🍓",
        description: "Biscoito com sabor morango irresistível",
        priceMin: 7,
        priceMax: 10,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o de Morango!",
      },
      {
        id: "flocos",
        name: "Flocos",
        emoji: "🍫",
        description: "Biscoito com flocos de chocolate irresistível",
        priceMin: 7,
        priceMax: 10,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o de Flocos!",
      },
    ],
  },
];

export function getStoresByCategory(category: StoreCategory): Store[] {
  return stores.filter((s) => s.category === category);
}

export function getAllCategories(): StoreCategory[] {
  return Object.keys(categoryLabels) as StoreCategory[];
}
