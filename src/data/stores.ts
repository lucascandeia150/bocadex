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
    id: "biscoitos-nata",
    name: "Biscoitos de Nata Caseiros",
    emoji: "🧈",
    category: "doces",
    description: "Biscoitos artesanais fresquinhos, perfeitos para acompanhar café ☕",
    whatsapp: "5527988330329",
    highlighted: true,
    products: [
      {
        id: "biscoito-nata-p",
        name: "Biscoito de Nata",
        emoji: "🍪",
        description: "Biscoitos de nata fresquinhos, caseiros e macios",
        priceMin: 15,
        priceMax: 25,
        whatsappMessage: "Olá! Vim pelo app EscolheAí e quero pedir biscoitos de nata 😄",
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
