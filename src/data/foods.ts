export interface Food {
  id: string;
  name: string;
  emoji: string;
  priceMin: number;
  priceMax: number;
  speed: "rapido" | "medio" | "demorado";
  filling: boolean; // mata muita fome
  cheap: boolean;
  reason: string;
}

export const foods: Food[] = [
  {
    id: "arroz-feijao",
    name: "Arroz e Feijão",
    emoji: "🍚",
    priceMin: 12,
    priceMax: 20,
    speed: "medio",
    filling: true,
    cheap: true,
    reason: "Completo, nutritivo e econômico",
  },
  {
    id: "macarrao",
    name: "Macarrão",
    emoji: "🍝",
    priceMin: 10,
    priceMax: 25,
    speed: "medio",
    filling: true,
    cheap: true,
    reason: "Sustenta bem e cabe no bolso",
  },
  {
    id: "pizza",
    name: "Pizza",
    emoji: "🍕",
    priceMin: 25,
    priceMax: 50,
    speed: "demorado",
    filling: true,
    cheap: false,
    reason: "Perfeita para dividir e satisfazer",
  },
  {
    id: "hamburguer",
    name: "Hambúrguer",
    emoji: "🍔",
    priceMin: 15,
    priceMax: 35,
    speed: "rapido",
    filling: true,
    cheap: false,
    reason: "Rápido e delicioso",
  },
  {
    id: "salada",
    name: "Salada",
    emoji: "🥗",
    priceMin: 12,
    priceMax: 22,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Leve, saudável e acessível",
  },
  {
    id: "omelete",
    name: "Omelete",
    emoji: "🍳",
    priceMin: 8,
    priceMax: 15,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Rápido, fácil e muito barato",
  },
  {
    id: "sanduiche",
    name: "Sanduíche",
    emoji: "🥪",
    priceMin: 8,
    priceMax: 20,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Prático e econômico",
  },
  {
    id: "marmita",
    name: "Marmita",
    emoji: "🥡",
    priceMin: 12,
    priceMax: 18,
    speed: "rapido",
    filling: true,
    cheap: true,
    reason: "Economia em relação a fast food",
  },
  {
    id: "pastel",
    name: "Pastel",
    emoji: "🥟",
    priceMin: 6,
    priceMax: 12,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Rápido e barato",
  },
  {
    id: "acai",
    name: "Açaí",
    emoji: "🫐",
    priceMin: 15,
    priceMax: 30,
    speed: "rapido",
    filling: false,
    cheap: false,
    reason: "Refrescante e energético",
  },
  {
    id: "coxinha",
    name: "Coxinha",
    emoji: "🍗",
    priceMin: 5,
    priceMax: 10,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Clássico brasileiro, rápido e barato",
  },
  {
    id: "pf",
    name: "Prato Feito (PF)",
    emoji: "🍛",
    priceMin: 15,
    priceMax: 25,
    speed: "medio",
    filling: true,
    cheap: true,
    reason: "Completo e com ótimo custo-benefício",
  },
];

export const speedLabels: Record<Food["speed"], string> = {
  rapido: "⚡ Rápido",
  medio: "⏱️ Médio",
  demorado: "🕐 Demorado",
};

export function getSuggestion(hungryLevel: boolean, wantCheap: boolean, wantFast: boolean): Food {
  let filtered = foods.filter((f) => {
    let score = 0;
    if (hungryLevel && f.filling) score++;
    if (wantCheap && f.cheap) score++;
    if (wantFast && f.speed === "rapido") score++;
    return score >= 2;
  });

  if (filtered.length === 0) {
    filtered = foods;
  }

  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomFood(exclude?: string): Food {
  const available = exclude ? foods.filter((f) => f.id !== exclude) : foods;
  return available[Math.floor(Math.random() * available.length)];
}

export function getCheapFoods(): Food[] {
  return foods.filter((f) => f.cheap).sort((a, b) => a.priceMin - b.priceMin);
}
