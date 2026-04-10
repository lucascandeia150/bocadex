/**
 * Amazon affiliate links for common ingredients.
 * Base tag: https://amzn.to/41sRMWn
 * 
 * When no specific link exists for an ingredient, we fall back
 * to a search on Amazon with the affiliate tag.
 */

const AFFILIATE_TAG = "escolheai-20";
const BASE_AFFILIATE_URL = "https://amzn.to/41sRMWn";

/** Map of ingredient keywords → direct affiliate URLs */
const directLinks: Record<string, string> = {
  "leite condensado": "https://amzn.to/41sRMWn",
  "maisena": "https://amzn.to/41sRMWn",
  "manteiga": "https://amzn.to/41sRMWn",
  "açúcar": "https://amzn.to/41sRMWn",
  "café": "https://amzn.to/41sRMWn",
  "chocolate": "https://amzn.to/41sRMWn",
  "leite": "https://amzn.to/41sRMWn",
  "farinha": "https://amzn.to/41sRMWn",
  "óleo": "https://amzn.to/41sRMWn",
  "azeite": "https://amzn.to/41sRMWn",
  "arroz": "https://amzn.to/41sRMWn",
  "feijão": "https://amzn.to/41sRMWn",
  "macarrão": "https://amzn.to/41sRMWn",
  "molho de tomate": "https://amzn.to/41sRMWn",
  "queijo": "https://amzn.to/41sRMWn",
  "requeijão": "https://amzn.to/41sRMWn",
  "cream cheese": "https://amzn.to/41sRMWn",
  "granola": "https://amzn.to/41sRMWn",
  "aveia": "https://amzn.to/41sRMWn",
  "mel": "https://amzn.to/41sRMWn",
  "sal": "https://amzn.to/41sRMWn",
  "fermento": "https://amzn.to/41sRMWn",
  "ovo": "https://amzn.to/41sRMWn",
  "ovos": "https://amzn.to/41sRMWn",
  "nata": "https://amzn.to/41sRMWn",
  "creme de leite": "https://amzn.to/41sRMWn",
};

/**
 * Returns the best affiliate link for an ingredient string.
 * Tries to match known keywords, otherwise builds an Amazon search URL.
 */
export function getAffiliateLink(ingredient: string): string {
  const normalized = ingredient.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, url] of Object.entries(directLinks)) {
    const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized.includes(normalizedKeyword)) {
      return url;
    }
  }

  // Fallback: Amazon search with affiliate tag
  const searchTerm = ingredient.replace(/^\d+\s*(xícaras?|colheres?|unidades?|ml|g|kg|l|litros?)\s*(de\s+)?/i, "").trim();
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(searchTerm)}&tag=${AFFILIATE_TAG}`;
}

/**
 * Returns the general affiliate link for a full recipe (all ingredients).
 */
export function getRecipeAffiliateLink(): string {
  return BASE_AFFILIATE_URL;
}
