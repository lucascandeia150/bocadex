import biscoitoNata from "@/assets/stores/biscoito-nata.jpg";
import biscoitoMorango from "@/assets/stores/biscoito-morango.jpg";
import biscoitoChocolate from "@/assets/stores/biscoito-chocolate.jpg";
import biscoitoDoceLeite from "@/assets/stores/biscoito-doce-leite.jpg";
import coxinhaImg from "@/assets/stores/coxinha.jpg";
import maravilhaImg from "@/assets/stores/maravilha.jpg";
import amstelImg from "@/assets/stores/amstel.jpg";

export interface StoreReview {
  text: string;
  stars: number;
}

export interface StoreProduct {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  description: string;
  priceMin: number;
  priceMax: number;
  whatsappMessage: string;
}

export interface Store {
  id: string;
  name: string;
  emoji: string;
  logo?: string;
  category: StoreCategory;
  description: string;
  whatsapp: string;
  address?: string;
  products: StoreProduct[];
  highlighted?: boolean;
  offer?: string;
  ingredients?: string[];
  reviews?: StoreReview[];
}

export type StoreCategory = "lanchonetes" | "pizzarias" | "restaurantes" | "cafes" | "doces" | "bebidas";

export const categoryLabels: Record<StoreCategory, { label: string; emoji: string }> = {
  lanchonetes: { label: "Lanchonetes", emoji: "🍔" },
  pizzarias: { label: "Pizzarias", emoji: "🍕" },
  restaurantes: { label: "Restaurantes", emoji: "🍽️" },
  cafes: { label: "Cafés", emoji: "☕" },
  doces: { label: "Doces", emoji: "🍪" },
  bebidas: { label: "Bebidas", emoji: "🍻" },
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
        image: biscoitoNata,
        description: "O clássico biscoito de nata, crocante por fora e macio por dentro",
        priceMin: 8,
        priceMax: 8,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o Nata Tradicional!",
      },
      {
        id: "goiabinha",
        name: "Goiabinha",
        emoji: "🍓",
        image: biscoitoMorango,
        description: "Biscoito recheado com goiabada caseira",
        priceMin: 8,
        priceMax: 8,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre a Goiabinha!",
      },
      {
        id: "doce-de-leite",
        name: "Doce de Leite",
        emoji: "🥛",
        image: biscoitoDoceLeite,
        description: "Biscoito com recheio cremoso de doce de leite",
        priceMin: 8,
        priceMax: 8,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o de Doce de Leite!",
      },
      {
        id: "morango",
        name: "Morango",
        emoji: "🍓",
        description: "Biscoito com sabor morango irresistível",
        priceMin: 8,
        priceMax: 8,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o de Morango!",
      },
      {
        id: "flocos",
        name: "Flocos",
        emoji: "🍫",
        description: "Biscoito com flocos de chocolate irresistível",
        priceMin: 8,
        priceMax: 8,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o de Flocos!",
      },
      {
        id: "nata-recheio-morango",
        name: "Nata com Recheio de Morango",
        emoji: "🍓",
        image: biscoitoMorango,
        description: "Biscoitos caseiros de nata com recheio cremoso de morango, macios e deliciosos.",
        priceMin: 10,
        priceMax: 10,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o Nata com Recheio de Morango!",
      },
      {
        id: "nata-recheio-chocolate",
        name: "Nata com Recheio de Chocolate",
        emoji: "🍫",
        image: biscoitoChocolate,
        description: "Biscoitos caseiros de nata com recheio cremoso de chocolate, perfeitos para qualquer momento.",
        priceMin: 10,
        priceMax: 10,
        whatsappMessage: "Olá! Vi os biscoitos no EscolheAí 😄 Quero saber mais sobre o Nata com Recheio de Chocolate!",
      },
      {
        id: "coxinha-tete",
        name: "Coxinha",
        emoji: "🍗",
        description: "Coxinha crocante por fora e cremosa por dentro, recheio bem temperado.",
        priceMin: 5,
        priceMax: 7,
        whatsappMessage: "Olá! Vi no EscolheAí 😄 Quero saber mais sobre as Coxinhas!",
      },
      {
        id: "maravilha-tete",
        name: "Maravilha",
        emoji: "🥐",
        description: "Salgado tipo maravilha, dourado e macio, perfeito para lanches rápidos.",
        priceMin: 5,
        priceMax: 7,
        whatsappMessage: "Olá! Vi no EscolheAí 😄 Quero saber mais sobre a Maravilha!",
      },
      {
        id: "amstel-tete",
        name: "Cerveja Amstel",
        emoji: "🍺",
        description: "Cerveja Amstel bem gelada, perfeita para acompanhar os lanches.",
        priceMin: 6,
        priceMax: 8,
        whatsappMessage: "Olá! Vi no EscolheAí 😄 Quero uma Cerveja Amstel!",
      },
    ],
  },
  {
    id: "e-pra-ja",
    name: "É Pra Já",
    emoji: "🍺",
    category: "bebidas",
    description: "Tudo que você precisa em um só lugar: bebidas, snacks e mais 😋\n⚠️ Não fazemos entrega",
    whatsapp: "557327998060801",
    address: "Rua Donadilson da Rocha Barros, R. Marcos Aurélio Castro - São Francisco, Serra - ES, 29175-207",
    highlighted: true,
    offer: "🍺 Cerveja gelada, é pra já!",
    reviews: [
      { text: "Cerveja sempre geladinha!", stars: 5 },
      { text: "Melhor distribuidora da região!", stars: 5 },
      { text: "Preço justo e atendimento top!", stars: 5 },
    ],
    products: [
      {
        id: "cerveja",
        name: "Cerveja Gelada",
        emoji: "🍺",
        description: "Cerveja gelada, diversas marcas disponíveis",
        priceMin: 5,
        priceMax: 15,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre as cervejas!",
      },
      {
        id: "mix-drinks",
        name: "Mix (Ice)",
        emoji: "🍹",
        description: "Mix tipo ice, refrescante e gelado",
        priceMin: 8,
        priceMax: 18,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os Mix!",
      },
      {
        id: "copao-whisky",
        name: "Copão de Whisky",
        emoji: "🥃",
        description: "Copão de whisky preparado na hora",
        priceMin: 15,
        priceMax: 25,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre o Copão de Whisky!",
      },
      {
        id: "refrigerante-epraja",
        name: "Refrigerante",
        emoji: "🥤",
        description: "Refrigerantes gelados de todas as marcas",
        priceMin: 5,
        priceMax: 10,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os refrigerantes!",
      },
      {
        id: "agua-epraja",
        name: "Água",
        emoji: "💧",
        description: "Água mineral gelada",
        priceMin: 3,
        priceMax: 5,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero uma água gelada!",
      },
      {
        id: "energetico",
        name: "Energético",
        emoji: "⚡",
        description: "Energéticos gelados para dar aquele gás",
        priceMin: 12,
        priceMax: 20,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os energéticos!",
      },
      {
        id: "vodkas",
        name: "Vodkas",
        emoji: "🍸",
        description: "Vodkas diversas marcas",
        priceMin: 10,
        priceMax: 25,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre as vodkas!",
      },
      {
        id: "cigarros",
        name: "Cigarros",
        emoji: "🚬",
        description: "Cigarros variados",
        priceMin: 8,
        priceMax: 15,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os cigarros!",
      },
      {
        id: "chips-epraja",
        name: "Chips",
        emoji: "🍟",
        description: "Salgadinhos e chips variados",
        priceMin: 5,
        priceMax: 12,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os chips!",
      },
      {
        id: "doces-epraja",
        name: "Doces",
        emoji: "🍫",
        description: "Chocolates e doces variados",
        priceMin: 3,
        priceMax: 10,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os doces!",
      },
      {
        id: "salgados-epraja",
        name: "Salgados",
        emoji: "🥪",
        description: "Salgados fresquinhos",
        priceMin: 5,
        priceMax: 10,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os salgados!",
      },
    ],
  },
  {
    id: "pj-distribuidora",
    name: "PJ Distribuidora",
    emoji: "🍺",
    category: "bebidas",
    description: "Distribuidora completa com bebidas geladas e variedade pra você! 🍺\n⚠️ Não fazemos entrega",
    whatsapp: "5527997451821",
    address: "R. Santa Lúcia - São Francisco, Serra - ES, 29175-222 (Próximo ao campo de futebol Arena São Francisco)",
    highlighted: true,
    offer: "🍺 Bebidas geladas e muito mais!",
    reviews: [
      { text: "Variedade incrível de bebidas!", stars: 5 },
      { text: "Preço bom e atendimento rápido!", stars: 5 },
      { text: "Sempre encontro o que preciso!", stars: 5 },
    ],
    products: [
      {
        id: "cerveja-pj",
        name: "Cerveja Gelada",
        emoji: "🍺",
        description: "Cervejas geladas de diversas marcas",
        priceMin: 5,
        priceMax: 15,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre as cervejas!",
      },
      {
        id: "refrigerante-pj",
        name: "Refrigerante",
        emoji: "🥤",
        description: "Refrigerantes gelados de todas as marcas",
        priceMin: 5,
        priceMax: 10,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os refrigerantes!",
      },
      {
        id: "agua-pj",
        name: "Água",
        emoji: "💧",
        description: "Água mineral gelada",
        priceMin: 3,
        priceMax: 5,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero uma água gelada!",
      },
      {
        id: "energetico-pj",
        name: "Energético",
        emoji: "⚡",
        description: "Energéticos gelados para dar aquele gás",
        priceMin: 12,
        priceMax: 20,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os energéticos!",
      },
      {
        id: "whisky-pj",
        name: "Whisky",
        emoji: "🥃",
        description: "Whisky de diversas marcas",
        priceMin: 15,
        priceMax: 50,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os whiskys!",
      },
      {
        id: "vodka-pj",
        name: "Vodka",
        emoji: "🍸",
        description: "Vodkas diversas marcas",
        priceMin: 10,
        priceMax: 30,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre as vodkas!",
      },
      {
        id: "snacks-pj",
        name: "Snacks",
        emoji: "🍟",
        description: "Salgadinhos e chips variados",
        priceMin: 5,
        priceMax: 12,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os snacks!",
      },
      {
        id: "doces-pj",
        name: "Doces",
        emoji: "🍬",
        description: "Balas, chocolates e doces variados",
        priceMin: 3,
        priceMax: 10,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os doces!",
      },
      {
        id: "cigarros-pj",
        name: "Cigarros",
        emoji: "🚬",
        description: "Cigarros variados",
        priceMin: 8,
        priceMax: 15,
        whatsappMessage: "Olá! Vi a loja no EscolheAí 😄 Quero saber mais sobre os cigarros!",
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
