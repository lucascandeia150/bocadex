export interface Recipe {
  ingredients: string[];
  steps: string[];
  prepTime: string;
  costEstimate: number;
}

export interface DeliveryInfo {
  available: boolean;
  estimatedTime: string;
  platform: string;
  url: string;
  whatsapp?: string;
}

export interface Food {
  id: string;
  name: string;
  emoji: string;
  priceMin: number;
  priceMax: number;
  speed: "rapido" | "medio" | "demorado";
  filling: boolean;
  cheap: boolean;
  reason: string;
  recommended?: boolean;
  bestValue?: boolean;
  savingsAmount?: number;
  recipe: Recipe;
  delivery: DeliveryInfo;
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
    bestValue: true,
    savingsAmount: 15,
    recipe: {
      ingredients: ["2 xícaras de arroz", "1 xícara de feijão cozido", "Alho, cebola, sal", "Óleo"],
      steps: ["Refogue alho e cebola no óleo", "Adicione o arroz e refogue", "Cubra com água e cozinhe", "Aqueça o feijão separadamente"],
      prepTime: "30min",
      costEstimate: 8,
    },
    delivery: { available: true, estimatedTime: "30-45min", platform: "Restaurante Parceiro", url: "", whatsapp: "5511999999001" },
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
    savingsAmount: 10,
    recipe: {
      ingredients: ["500g de macarrão", "Molho de tomate", "Sal", "Queijo ralado"],
      steps: ["Cozinhe o macarrão em água com sal", "Escorra e misture o molho", "Finalize com queijo ralado"],
      prepTime: "20min",
      costEstimate: 7,
    },
    delivery: { available: true, estimatedTime: "25-40min", platform: "Restaurante Parceiro", url: "", whatsapp: "5511999999002" },
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
    recommended: true,
    recipe: {
      ingredients: ["Massa de pizza pronta", "Molho de tomate", "Mussarela", "Orégano"],
      steps: ["Abra a massa numa assadeira", "Espalhe o molho e cubra com queijo", "Leve ao forno por 20min a 200°C"],
      prepTime: "35min",
      costEstimate: 15,
    },
    delivery: { available: true, estimatedTime: "35-50min", platform: "Pizzaria Parceira", url: "", whatsapp: "5511999999003" },
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
    recommended: true,
    recipe: {
      ingredients: ["Pão de hambúrguer", "Carne moída (blend)", "Queijo", "Alface, tomate"],
      steps: ["Tempere e modele a carne", "Grelhe por 3min de cada lado", "Monte com queijo e salada no pão"],
      prepTime: "15min",
      costEstimate: 12,
    },
    delivery: { available: true, estimatedTime: "20-35min", platform: "Hamburgueria Parceira", url: "", whatsapp: "5511999999004" },
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
    savingsAmount: 8,
    recipe: {
      ingredients: ["Alface, rúcula", "Tomate, pepino", "Azeite, limão, sal"],
      steps: ["Lave e pique os vegetais", "Misture tudo numa tigela", "Tempere com azeite e limão"],
      prepTime: "10min",
      costEstimate: 6,
    },
    delivery: { available: true, estimatedTime: "20-30min", platform: "Restaurante Parceiro", url: "", whatsapp: "5511999999005" },
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
    bestValue: true,
    savingsAmount: 20,
    recipe: {
      ingredients: ["3 ovos", "Sal, pimenta", "Queijo, presunto (opcional)", "Manteiga"],
      steps: ["Bata os ovos com sal", "Derreta manteiga na frigideira", "Despeje os ovos e adicione recheio", "Dobre e sirva"],
      prepTime: "8min",
      costEstimate: 4,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
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
    savingsAmount: 12,
    recipe: {
      ingredients: ["Pão de forma", "Presunto, queijo", "Alface, tomate", "Maionese"],
      steps: ["Monte as camadas no pão", "Corte ao meio e sirva"],
      prepTime: "5min",
      costEstimate: 5,
    },
    delivery: { available: true, estimatedTime: "15-25min", platform: "iFood", url: "https://www.ifood.com.br/busca?q=sanduiche" },
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
    bestValue: true,
    savingsAmount: 18,
    recipe: {
      ingredients: ["Arroz, feijão", "Carne ou frango", "Salada", "Farofa"],
      steps: ["Cozinhe arroz e feijão", "Prepare a proteína", "Monte a marmita com todos os itens"],
      prepTime: "40min",
      costEstimate: 10,
    },
    delivery: { available: true, estimatedTime: "20-30min", platform: "iFood", url: "https://www.ifood.com.br/busca?q=marmita" },
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
    savingsAmount: 15,
    recipe: {
      ingredients: ["Massa de pastel", "Carne moída ou queijo", "Óleo para fritar"],
      steps: ["Recheie a massa e feche bem", "Frite em óleo quente até dourar", "Escorra em papel toalha"],
      prepTime: "15min",
      costEstimate: 5,
    },
    delivery: { available: true, estimatedTime: "15-25min", platform: "iFood", url: "https://www.ifood.com.br/busca?q=pastel" },
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
    recommended: true,
    recipe: {
      ingredients: ["Polpa de açaí congelada", "Banana", "Granola", "Mel ou leite condensado"],
      steps: ["Bata a polpa com banana no liquidificador", "Sirva numa tigela", "Cubra com granola e mel"],
      prepTime: "5min",
      costEstimate: 10,
    },
    delivery: { available: true, estimatedTime: "15-25min", platform: "iFood", url: "https://www.ifood.com.br/busca?q=acai" },
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
    bestValue: true,
    savingsAmount: 20,
    recipe: {
      ingredients: ["Frango desfiado", "Massa de coxinha (farinha, caldo)", "Farinha de rosca", "Óleo para fritar"],
      steps: ["Prepare a massa com caldo de frango", "Modele com o recheio de frango", "Empane e frite até dourar"],
      prepTime: "45min",
      costEstimate: 8,
    },
    delivery: { available: true, estimatedTime: "15-20min", platform: "iFood", url: "https://www.ifood.com.br/busca?q=coxinha" },
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
    bestValue: true,
    recommended: true,
    savingsAmount: 12,
    recipe: {
      ingredients: ["Arroz, feijão", "Bife ou frango", "Ovo frito", "Salada e farofa"],
      steps: ["Cozinhe arroz e feijão", "Frite o bife e o ovo", "Monte o prato com todos os acompanhamentos"],
      prepTime: "35min",
      costEstimate: 12,
    },
    delivery: { available: true, estimatedTime: "25-40min", platform: "iFood", url: "https://www.ifood.com.br/busca?q=prato+feito" },
  },
];

export const speedLabels: Record<Food["speed"], string> = {
  rapido: "⚡ Rápido",
  medio: "⏱️ Médio",
  demorado: "🕐 Demorado",
};

export type BudgetLevel = "baixo" | "medio" | "alto";

export type PreferenceMode = "cozinhar" | "pedir" | "tanto-faz";

export function getPersonalizedSuggestion(
  hungry: boolean,
  budget: BudgetLevel,
  speed: "rapido" | "tanto-faz",
  preference?: PreferenceMode
): { food: Food; message: string; smartTip: string } {
  let filtered = foods.filter((f) => {
    let score = 0;
    if (hungry && f.filling) score++;
    if (!hungry && !f.filling) score++;
    if (budget === "baixo" && f.cheap) score++;
    if (budget === "medio") score++;
    if (budget === "alto") score++;
    if (speed === "rapido" && f.speed === "rapido") score++;
    if (speed === "tanto-faz") score++;
    return score >= 2;
  });

  if (filtered.length === 0) filtered = foods;

  const food = filtered[Math.floor(Math.random() * filtered.length)];

  const parts: string[] = [];
  if (hungry) parts.push("você está com muita fome");
  if (budget === "baixo") parts.push("quer gastar pouco");
  if (speed === "rapido") parts.push("está com pressa");

  let message: string;
  if (parts.length > 0) {
    message = `Como ${parts.join(" e ")}, essa é a melhor opção pra você:`;
  } else {
    message = "Boa escolha pra hoje! 🎯";
  }

  let smartTip: string;
  if (budget === "baixo" && preference !== "pedir") {
    smartTip = "💡 Hoje vale mais cozinhar, você economiza!";
  } else if (speed === "rapido" && preference !== "cozinhar") {
    smartTip = "💡 Se estiver com pressa, melhor pedir!";
  } else if (preference === "cozinhar") {
    smartTip = `💡 Fazendo em casa sai por ~R$${food.recipe.costEstimate} — economia de R$${food.priceMin - food.recipe.costEstimate}!`;
  } else {
    smartTip = "💡 Essa opção equilibra custo e tempo!";
  }

  return { food, message, smartTip };
}

export function getSuggestion(hungryLevel: boolean, wantCheap: boolean, wantFast: boolean): Food {
  let filtered = foods.filter((f) => {
    let score = 0;
    if (hungryLevel && f.filling) score++;
    if (wantCheap && f.cheap) score++;
    if (wantFast && f.speed === "rapido") score++;
    return score >= 2;
  });

  if (filtered.length === 0) filtered = foods;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getRandomFood(exclude?: string): Food {
  const available = exclude ? foods.filter((f) => f.id !== exclude) : foods;
  return available[Math.floor(Math.random() * available.length)];
}

export function getCheapFoods(): Food[] {
  return foods.filter((f) => f.cheap).sort((a, b) => a.priceMin - b.priceMin);
}

export function getBestValueFoods(): Food[] {
  return foods.filter((f) => f.bestValue);
}

export function getRecommendedFoods(): Food[] {
  return foods.filter((f) => f.recommended);
}
