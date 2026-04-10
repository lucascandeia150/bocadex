import { trackAnalyticsEvent } from "@/lib/trackEvent";
import { getAffiliateLink, getRecipeAffiliateLink } from "@/data/affiliateLinks";

/**
 * Opens Amazon affiliate link for buying all ingredients of a recipe.
 */
export function openBuyIngredients(foodName: string, _ingredients: string[]) {
  const url = getRecipeAffiliateLink();
  trackAnalyticsEvent("buy_ingredients_click", { food: foodName, destination: "amazon" });
  window.open(url, "_blank");
}

/**
 * Opens Amazon affiliate link for a specific ingredient.
 */
export function openBuyIngredient(ingredient: string, foodName: string) {
  const url = getAffiliateLink(ingredient);
  trackAnalyticsEvent("buy_ingredient_click", { food: foodName, ingredient, destination: "amazon" });
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
