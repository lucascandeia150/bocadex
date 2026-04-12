/**
 * Amazon affiliate links for common ingredients.
 * Now reads from the database (affiliate_links table) for real-time updates.
 * Falls back to hardcoded links if DB is unavailable.
 */

import { supabase } from "@/integrations/supabase/client";

const AFFILIATE_TAG = "escolheai-20";
const BASE_AFFILIATE_URL = "https://amzn.to/41sRMWn";

/** Cached DB links — refreshed on first call and periodically */
let cachedLinks: Record<string, string> | null = null;
let lastFetch = 0;
const CACHE_TTL = 60_000; // 1 minute

/** Hardcoded fallback */
const fallbackLinks: Record<string, string> = {
  "açúcar": "https://amzn.to/4tLFbty",
  "leite condensado": "https://amzn.to/4dIY8Z0",
  "chocolate em pó": "https://amzn.to/4cm2hQa",
  "chocolate": "https://amzn.to/4cm2hQa",
  "creme de leite": "https://amzn.to/4dO3ulX",
  "farinha": "https://amzn.to/3OdToQU",
  "suco de maracujá": "https://amzn.to/4t8DRkD",
  "maracujá": "https://amzn.to/4t8DRkD",
  "liquidificador": "https://amzn.to/3OAt2IP",
  "travessa": "https://amzn.to/4tNueaV",
  "leite": "https://amzn.to/4dIY8Z0",
  "manteiga": "https://amzn.to/41sRMWn",
  "café": "https://amzn.to/41sRMWn",
  "óleo": "https://amzn.to/41sRMWn",
  "azeite": "https://amzn.to/41sRMWn",
  "arroz": "https://amzn.to/41sRMWn",
  "feijão": "https://amzn.to/41sRMWn",
  "macarrão": "https://amzn.to/41sRMWn",
  "molho de tomate": "https://amzn.to/41sRMWn",
  "queijo": "https://amzn.to/41sRMWn",
  "fermento": "https://amzn.to/41sRMWn",
  "ovo": "https://amzn.to/41sRMWn",
  "ovos": "https://amzn.to/41sRMWn",
  "sal": "https://amzn.to/41sRMWn",
  "mel": "https://amzn.to/41sRMWn",
  "nata": "https://amzn.to/41sRMWn",
  "maisena": "https://amzn.to/41sRMWn",
  "aveia": "https://amzn.to/41sRMWn",
  "granola": "https://amzn.to/41sRMWn",
  "requeijão": "https://amzn.to/41sRMWn",
  "cream cheese": "https://amzn.to/41sRMWn",
};

async function loadDbLinks(): Promise<Record<string, string>> {
  if (cachedLinks && Date.now() - lastFetch < CACHE_TTL) {
    return cachedLinks;
  }
  try {
    const { data } = await supabase.from("affiliate_links").select("keyword, url");
    if (data && data.length > 0) {
      const map: Record<string, string> = {};
      data.forEach((row) => { map[row.keyword.toLowerCase()] = row.url; });
      cachedLinks = map;
      lastFetch = Date.now();
      return map;
    }
  } catch {
    // fall through to fallback
  }
  return fallbackLinks;
}

/**
 * Returns the best affiliate link for an ingredient string.
 * Reads from DB first, falls back to hardcoded.
 */
export async function getAffiliateLinkAsync(ingredient: string): Promise<string> {
  const links = await loadDbLinks();
  return matchIngredient(ingredient, links);
}

/**
 * Synchronous version using cached data (or fallback).
 */
export function getAffiliateLink(ingredient: string): string {
  const links = cachedLinks || fallbackLinks;
  return matchIngredient(ingredient, links);
}

function matchIngredient(ingredient: string, links: Record<string, string>): string {
  const normalized = ingredient.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [keyword, url] of Object.entries(links)) {
    const normalizedKeyword = keyword.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized.includes(normalizedKeyword)) {
      return url;
    }
  }

  const searchTerm = ingredient.replace(/^\d+\s*(xícaras?|colheres?|unidades?|ml|g|kg|l|litros?)\s*(de\s+)?/i, "").trim();
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(searchTerm)}&tag=${AFFILIATE_TAG}`;
}

/** Preload DB links on app start */
export function preloadAffiliateLinks(): void {
  loadDbLinks();
}

export function getRecipeAffiliateLink(): string {
  return BASE_AFFILIATE_URL;
}
