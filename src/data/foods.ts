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
  type?: "comida" | "bebida";
  tag?: string;
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
    type: "comida",
    tag: "econômico",
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
    type: "comida",
    tag: "econômico",
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
    type: "comida",
    tag: "clássico",
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
    type: "comida",
    tag: "rápido",
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
    type: "comida",
    tag: "leve",
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
    type: "comida",
    tag: "econômico",
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
    type: "comida",
    tag: "rápido",
    recipe: {
      ingredients: ["Pão de forma", "Presunto, queijo", "Alface, tomate", "Maionese"],
      steps: ["Monte as camadas no pão", "Corte ao meio e sirva"],
      prepTime: "5min",
      costEstimate: 5,
    },
    delivery: { available: true, estimatedTime: "15-25min", platform: "Lanchonete Parceira", url: "", whatsapp: "5511999999007" },
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
    type: "comida",
    tag: "econômico",
    recipe: {
      ingredients: ["Arroz, feijão", "Carne ou frango", "Salada", "Farofa"],
      steps: ["Cozinhe arroz e feijão", "Prepare a proteína", "Monte a marmita com todos os itens"],
      prepTime: "40min",
      costEstimate: 10,
    },
    delivery: { available: true, estimatedTime: "20-30min", platform: "Marmitaria Parceira", url: "", whatsapp: "5511999999008" },
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
    type: "comida",
    tag: "rápido",
    recipe: {
      ingredients: ["Massa de pastel", "Carne moída ou queijo", "Óleo para fritar"],
      steps: ["Recheie a massa e feche bem", "Frite em óleo quente até dourar", "Escorra em papel toalha"],
      prepTime: "15min",
      costEstimate: 5,
    },
    delivery: { available: true, estimatedTime: "15-25min", platform: "Pastelaria Parceira", url: "", whatsapp: "5511999999009" },
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
    type: "comida",
    tag: "leve",
    recipe: {
      ingredients: ["Polpa de açaí congelada", "Banana", "Granola", "Mel ou leite condensado"],
      steps: ["Bata a polpa com banana no liquidificador", "Sirva numa tigela", "Cubra com granola e mel"],
      prepTime: "5min",
      costEstimate: 10,
    },
    delivery: { available: true, estimatedTime: "15-25min", platform: "Açaiteria Parceira", url: "", whatsapp: "5511999999010" },
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
    type: "comida",
    tag: "rápido",
    recipe: {
      ingredients: ["Frango desfiado", "Massa de coxinha (farinha, caldo)", "Farinha de rosca", "Óleo para fritar"],
      steps: ["Prepare a massa com caldo de frango", "Modele com o recheio de frango", "Empane e frite até dourar"],
      prepTime: "45min",
      costEstimate: 8,
    },
    delivery: { available: true, estimatedTime: "15-20min", platform: "Lanchonete Parceira", url: "", whatsapp: "5511999999011" },
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
    type: "comida",
    tag: "econômico",
    recipe: {
      ingredients: ["Arroz, feijão", "Bife ou frango", "Ovo frito", "Salada e farofa"],
      steps: ["Cozinhe arroz e feijão", "Frite o bife e o ovo", "Monte o prato com todos os acompanhamentos"],
      prepTime: "35min",
      costEstimate: 12,
    },
    delivery: { available: true, estimatedTime: "25-40min", platform: "Restaurante Parceiro", url: "", whatsapp: "5511999999012" },
  },
  {
    id: "biscoito-nata",
    name: "Biscoito da Tetê",
    emoji: "🍪",
    priceMin: 7,
    priceMax: 20,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "🤤 Biscoitos caseiros que derretem na boca! Feitos com carinho 😋",
    recommended: true,
    bestValue: true,
    type: "comida",
    tag: "parceiro",
    recipe: {
      ingredients: ["Maisena", "Leite condensado desnatado", "Manteiga"],
      steps: ["Misture todos os ingredientes até formar uma massa homogênea", "Modele os biscoitos no formato desejado", "Asse em forno pré-aquecido a 180°C por 15-20 minutos", "Deixe esfriar e aproveite!"],
      prepTime: "30min",
      costEstimate: 8,
    },
    delivery: {
      available: true,
      estimatedTime: "Combinar via WhatsApp",
      platform: "Biscoito da Tetê",
      url: "",
      whatsapp: "5573998719117",
    },
  },
];

export const drinks: Food[] = [
  {
    id: "suco-natural",
    name: "Suco Natural",
    emoji: "🧃",
    priceMin: 5,
    priceMax: 12,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Refrescante e saudável",
    type: "bebida",
    tag: "leve",
    recipe: {
      ingredients: ["2 laranjas ou 1 manga", "Água", "Açúcar ou mel a gosto", "Gelo"],
      steps: ["Descasque e pique a fruta", "Bata no liquidificador com água", "Coe se preferir e adicione gelo"],
      prepTime: "5min",
      costEstimate: 3,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "cafe",
    name: "Café",
    emoji: "☕",
    priceMin: 3,
    priceMax: 10,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Energia rápida e econômica",
    bestValue: true,
    type: "bebida",
    tag: "econômico",
    recipe: {
      ingredients: ["2 colheres de café em pó", "Água quente", "Açúcar a gosto", "Filtro de papel"],
      steps: ["Ferva a água", "Coloque o filtro no coador", "Despeje a água sobre o pó lentamente", "Adoce a gosto"],
      prepTime: "5min",
      costEstimate: 1,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "milkshake",
    name: "Milkshake",
    emoji: "🥤",
    priceMin: 12,
    priceMax: 22,
    speed: "rapido",
    filling: false,
    cheap: false,
    reason: "Cremoso e indulgente",
    recommended: true,
    type: "bebida",
    tag: "especial",
    recipe: {
      ingredients: ["2 bolas de sorvete", "1 copo de leite", "Calda de chocolate", "Chantilly (opcional)"],
      steps: ["Bata o sorvete com leite no liquidificador", "Despeje no copo", "Cubra com calda e chantilly"],
      prepTime: "5min",
      costEstimate: 8,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "cha",
    name: "Chá",
    emoji: "🍵",
    priceMin: 2,
    priceMax: 8,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Relaxante e barato",
    bestValue: true,
    type: "bebida",
    tag: "leve",
    recipe: {
      ingredients: ["1 sachê de chá (camomila, hortelã, etc.)", "Água quente", "Mel ou açúcar"],
      steps: ["Ferva a água", "Coloque o sachê na xícara", "Despeje a água e aguarde 3-5min", "Adoce a gosto"],
      prepTime: "5min",
      costEstimate: 1,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "agua-saborizada",
    name: "Água Saborizada",
    emoji: "💧",
    priceMin: 3,
    priceMax: 8,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Hidratante e refrescante",
    type: "bebida",
    tag: "leve",
    recipe: {
      ingredients: ["1 litro de água gelada", "Rodelas de limão ou pepino", "Folhas de hortelã", "Gelo"],
      steps: ["Corte o limão ou pepino em rodelas", "Coloque na jarra com água e hortelã", "Adicione gelo e deixe gelar por 10min"],
      prepTime: "5min",
      costEstimate: 2,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "refrigerante",
    name: "Refrigerante",
    emoji: "🥫",
    priceMin: 4,
    priceMax: 10,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Prático e refrescante",
    type: "bebida",
    tag: "rápido",
    recipe: {
      ingredients: ["Refrigerante gelado", "Gelo", "Copo grande"],
      steps: ["Coloque gelo no copo", "Despeje o refrigerante", "Sirva imediatamente"],
      prepTime: "1min",
      costEstimate: 5,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "cerveja-artesanal",
    name: "Cerveja Artesanal",
    emoji: "🍺",
    priceMin: 12,
    priceMax: 25,
    speed: "rapido",
    filling: false,
    cheap: false,
    reason: "Sabor único e experiência premium",
    recommended: true,
    type: "bebida",
    tag: "especial",
    recipe: {
      ingredients: ["Cerveja artesanal gelada", "Copo apropriado (tulipa ou pint)", "Gelo (opcional)"],
      steps: ["Escolha o estilo: IPA, Pilsen, Stout ou Weiss", "Sirva inclinando o copo a 45°", "Aprecie com calma 🍻"],
      prepTime: "1min",
      costEstimate: 10,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "cerveja-lata",
    name: "Cerveja Gelada",
    emoji: "🍻",
    priceMin: 4,
    priceMax: 10,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Clássica e refrescante",
    bestValue: true,
    type: "bebida",
    tag: "rápido",
    recipe: {
      ingredients: ["Cerveja gelada (lata ou garrafa)", "Copo americano", "Gelo se preferir"],
      steps: ["Gele bem a cerveja", "Sirva no copo", "Brinde! 🍻"],
      prepTime: "1min",
      costEstimate: 4,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "caipirinha",
    name: "Caipirinha",
    emoji: "🍹",
    priceMin: 10,
    priceMax: 20,
    speed: "rapido",
    filling: false,
    cheap: false,
    reason: "O drink brasileiro por excelência",
    recommended: true,
    type: "bebida",
    tag: "especial",
    recipe: {
      ingredients: ["1 limão", "2 colheres de açúcar", "50ml de cachaça", "Gelo picado"],
      steps: ["Corte o limão em pedaços e coloque no copo", "Adicione o açúcar e macere bem", "Coloque gelo e despeje a cachaça", "Misture e sirva"],
      prepTime: "5min",
      costEstimate: 5,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "mojito",
    name: "Mojito",
    emoji: "🌿",
    priceMin: 15,
    priceMax: 28,
    speed: "rapido",
    filling: false,
    cheap: false,
    reason: "Refrescante e sofisticado",
    recommended: true,
    type: "bebida",
    tag: "especial",
    recipe: {
      ingredients: ["50ml de rum branco", "Suco de 1 limão", "6 folhas de hortelã", "2 colheres de açúcar", "Água com gás", "Gelo"],
      steps: ["Macere hortelã com açúcar e limão", "Adicione gelo e rum", "Complete com água com gás", "Decore com hortelã"],
      prepTime: "5min",
      costEstimate: 8,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "whisky",
    name: "Whisky",
    emoji: "🥃",
    priceMin: 15,
    priceMax: 40,
    speed: "rapido",
    filling: false,
    cheap: false,
    reason: "Para momentos especiais",
    type: "bebida",
    tag: "especial",
    recipe: {
      ingredients: ["50ml de whisky", "Gelo (opcional)", "Copo old fashioned"],
      steps: ["Coloque gelo no copo se preferir", "Despeje o whisky lentamente", "Aprecie puro ou com um toque de água"],
      prepTime: "1min",
      costEstimate: 15,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "gin-tonica",
    name: "Gin Tônica",
    emoji: "🍸",
    priceMin: 15,
    priceMax: 30,
    speed: "rapido",
    filling: false,
    cheap: false,
    reason: "Elegante e refrescante",
    recommended: true,
    type: "bebida",
    tag: "especial",
    recipe: {
      ingredients: ["50ml de gin", "150ml de água tônica", "Fatias de pepino ou limão", "Gelo", "Especiarias (zimbro, alecrim)"],
      steps: ["Coloque bastante gelo na taça", "Despeje o gin", "Complete com água tônica", "Decore com pepino e especiarias"],
      prepTime: "3min",
      costEstimate: 10,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "vodka-energetico",
    name: "Vodka com Energético",
    emoji: "⚡",
    priceMin: 15,
    priceMax: 30,
    speed: "rapido",
    filling: false,
    cheap: false,
    reason: "Energia e diversão",
    type: "bebida",
    tag: "especial",
    recipe: {
      ingredients: ["50ml de vodka", "1 lata de energético", "Gelo", "Rodela de limão"],
      steps: ["Coloque gelo no copo", "Despeje a vodka", "Complete com energético", "Decore com limão"],
      prepTime: "2min",
      costEstimate: 12,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "limonada",
    name: "Limonada Suíça",
    emoji: "🍋",
    priceMin: 5,
    priceMax: 12,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Refrescante e fácil de fazer",
    bestValue: true,
    type: "bebida",
    tag: "leve",
    recipe: {
      ingredients: ["2 limões", "Leite condensado a gosto", "500ml de água", "Gelo"],
      steps: ["Bata tudo no liquidificador por 10 segundos", "Coe rapidamente", "Sirva com bastante gelo"],
      prepTime: "5min",
      costEstimate: 3,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
  {
    id: "chocolate-quente",
    name: "Chocolate Quente",
    emoji: "🍫",
    priceMin: 5,
    priceMax: 12,
    speed: "rapido",
    filling: false,
    cheap: true,
    reason: "Aconchegante e delicioso",
    type: "bebida",
    tag: "econômico",
    recipe: {
      ingredients: ["2 colheres de chocolate em pó", "1 copo de leite", "Açúcar a gosto", "Chantilly (opcional)"],
      steps: ["Aqueça o leite", "Misture o chocolate em pó", "Adoce a gosto", "Cubra com chantilly se quiser"],
      prepTime: "5min",
      costEstimate: 3,
    },
    delivery: { available: false, estimatedTime: "", platform: "", url: "" },
  },
];

export const allItems: Food[] = [...foods, ...drinks];

export const speedLabels: Record<Food["speed"], string> = {
  rapido: "⚡ Rápido",
  medio: "⏱️ Médio",
  demorado: "🕐 Demorado",
};

export type BudgetLevel = "baixo" | "medio" | "alto";

export type PreferenceMode = "cozinhar" | "pedir" | "tanto-faz";

// Pairing rules: maps food tags/ids to preferred drink tags
const drinkPairings: Record<string, string[]> = {
  "arroz-feijao": ["refrigerante", "suco-natural", "cerveja-lata"],
  "macarrao": ["refrigerante", "suco-natural", "cerveja-lata"],
  "pizza": ["refrigerante", "cerveja-artesanal", "cerveja-lata"],
  "hamburguer": ["refrigerante", "milkshake", "cerveja-lata", "cerveja-artesanal"],
  "salada": ["suco-natural", "agua-saborizada", "limonada"],
  "omelete": ["cafe", "suco-natural", "chocolate-quente"],
  "sanduiche": ["suco-natural", "refrigerante", "limonada"],
  "marmita": ["refrigerante", "suco-natural", "cerveja-lata"],
  "pastel": ["cafe", "suco-natural", "refrigerante", "cerveja-lata"],
  "acai": ["agua-saborizada", "limonada"],
  "coxinha": ["refrigerante", "cafe", "cerveja-lata"],
  "pf": ["refrigerante", "suco-natural", "cerveja-lata"],
  "biscoito-nata": ["cafe", "cha", "chocolate-quente"],
};

const comboPhrases = [
  "Hoje vai bem:",
  "Combo perfeito pra você:",
  "Que tal esse combo?",
  "A combinação ideal:",
  "Sugestão completa pra hoje:",
];

const drinkContextPhrases = [
  "Vai uma bebida pra acompanhar? 🍹",
  "Tá calor? Que tal uma bebida gelada! ☀️",
  "Completa com essa bebida! 🥤",
  "Pra deixar a refeição completa:",
];

export function getPairedDrink(food: Food): Food {
  const preferredIds = drinkPairings[food.id] || [];
  const preferred = drinks.filter((d) => preferredIds.includes(d.id));
  if (preferred.length > 0) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }
  // Fallback: random drink
  return drinks[Math.floor(Math.random() * drinks.length)];
}

export function getComboPhrase(): string {
  return comboPhrases[Math.floor(Math.random() * comboPhrases.length)];
}

export function getDrinkContextPhrase(): string {
  return drinkContextPhrases[Math.floor(Math.random() * drinkContextPhrases.length)];
}

export function getRandomDrink(exclude?: string): Food {
  // Prioritize partner-linked drinks (drinks with delivery from partners)
  const partnerDrinks = drinks.filter((d) => d.tag === "parceiro" && d.id !== exclude);
  const available = exclude ? drinks.filter((d) => d.id !== exclude) : drinks;
  
  if (partnerDrinks.length > 0 && Math.random() < 0.7) {
    return partnerDrinks[Math.floor(Math.random() * partnerDrinks.length)];
  }
  
  return available[Math.floor(Math.random() * available.length)];
}

export function getPersonalizedSuggestion(
  hungry: boolean,
  budget: BudgetLevel,
  speed: "rapido" | "tanto-faz",
  preference?: PreferenceMode
): { food: Food; drink: Food; message: string; smartTip: string; drinkPhrase: string } {
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
  const drink = getPairedDrink(food);

  const parts: string[] = [];
  if (hungry) parts.push("você está com muita fome");
  if (budget === "baixo") parts.push("quer gastar pouco");
  if (speed === "rapido") parts.push("está com pressa");

  let message: string;
  if (parts.length > 0) {
    message = `Como ${parts.join(" e ")}, essa é a melhor opção pra você:`;
  } else {
    message = getComboPhrase();
  }

  let smartTip: string;
  if (budget === "baixo" && preference !== "pedir") {
    smartTip = "💡 Hoje vale mais cozinhar, você economiza!";
  } else if (speed === "rapido" && preference !== "cozinhar") {
    smartTip = "💡 Se estiver com pressa, melhor pedir!";
  } else if (preference === "cozinhar") {
    smartTip = `💡 Fazendo em casa sai por ~R$${food.recipe.costEstimate + drink.recipe.costEstimate} — economia de R$${(food.priceMin + drink.priceMin) - (food.recipe.costEstimate + drink.recipe.costEstimate)}!`;
  } else {
    smartTip = "💡 Essa opção equilibra custo e tempo!";
  }

  return { food, drink, message, smartTip, drinkPhrase: getDrinkContextPhrase() };
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
  // Prioritize partner items (70% chance)
  const partnerItems = foods.filter((f) => f.tag === "parceiro" && f.id !== exclude);
  const nonPartnerItems = foods.filter((f) => f.tag !== "parceiro" && f.id !== exclude);
  
  if (partnerItems.length > 0 && Math.random() < 0.7) {
    return partnerItems[Math.floor(Math.random() * partnerItems.length)];
  }
  
  const available = nonPartnerItems.length > 0 ? nonPartnerItems : foods.filter((f) => f.id !== exclude);
  return available[Math.floor(Math.random() * available.length)];
}

export function getRandomItem(exclude?: string): Food {
  const available = exclude ? allItems.filter((f) => f.id !== exclude) : allItems;
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
