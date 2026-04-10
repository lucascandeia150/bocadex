import { trackAnalyticsEvent } from "@/lib/trackEvent";

/**
 * Opens a Google search for buying ingredients — ready to swap
 * with Amazon/Mercado Livre affiliate links when available.
 */
export function openBuyIngredients(foodName: string, ingredients: string[]) {
  const query = encodeURIComponent(`comprar ${ingredients.slice(0, 3).join(" ")} ${foodName}`);
  const url = `https://www.google.com/search?q=${query}`;
  trackAnalyticsEvent("buy_ingredients_click", { food: foodName });
  window.open(url, "_blank");
}

/**
 * Opens YouTube search for a recipe video.
 */
export function openRecipeVideo(foodName: string) {
  const query = encodeURIComponent(`receita ${foodName} fácil e barata`);
  const url = `https://www.youtube.com/results?search_query=${query}`;
  trackAnalyticsEvent("recipe_video_click", { food: foodName });
  window.open(url, "_blank");
}

/**
 * Opens a Google search for more food options.
 */
export function openMoreOptions(foodName: string) {
  const query = encodeURIComponent(`${foodName} onde comprar perto de mim`);
  const url = `https://www.google.com/search?q=${query}`;
  trackAnalyticsEvent("more_options_click", { food: foodName });
  window.open(url, "_blank");
}
