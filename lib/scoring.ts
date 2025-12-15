import { Product, ParsedRider, MatchScore, ProductRecommendation } from "@/types";

/**
 * Calculate match score between a product and a parsed rider.
 */
export function calculateProductScore(
  product: Product,
  rider: ParsedRider
): number {
  let score = 0;

  // Base score for festival fit
  score += product.festivalFit * 5;

  // Preference matching (high weight)
  const matchingPreferences = rider.preferences.filter(
    (pref) =>
      product.tags.includes(pref) ||
      product.category === pref ||
      product.tags.some((tag) => tag.includes(pref))
  );
  score += matchingPreferences.length * 15;

  // Category matching
  if (rider.categoriesWanted.includes(product.category)) {
    score += 20;
  }

  // Vibe tag matching
  const matchingVibeTags = rider.vibeTags.filter((vibe) =>
    product.tags.some((tag) => tag.includes(vibe))
  );
  score += matchingVibeTags.length * 10;

  // Allergen conflict (heavy penalty)
  const allergenConflict = product.allergens.some((allergen) =>
    rider.allergensAvoid.some(
      (avoid) => allergen.includes(avoid) || avoid.includes(allergen)
    )
  );
  if (allergenConflict) {
    score -= 100; // Effectively excludes the product
  }

  // Budget tier matching
  if (rider.budgetTier) {
    const tierDiff = Math.abs(product.priceTier - rider.budgetTier);
    score -= tierDiff * 5;
  }

  return Math.max(0, score);
}

/**
 * Get recommended products sorted by match score.
 */
export function getRecommendedProducts(
  products: Product[],
  rider: ParsedRider,
  limit?: number
): ProductRecommendation[] {
  const recommendations = products
    .map((product) => ({
      product,
      score: calculateProductScore(product, rider),
      reasons: getMatchReasons(product, rider),
    }))
    .filter((rec) => rec.score > 0)
    .sort((a, b) => b.score - a.score);

  return limit ? recommendations.slice(0, limit) : recommendations;
}

/**
 * Get human-readable reasons why a product matches a rider.
 */
function getMatchReasons(product: Product, rider: ParsedRider): string[] {
  const reasons: string[] = [];

  // Check preferences
  const matchingPrefs = rider.preferences.filter((pref) =>
    product.tags.includes(pref)
  );
  if (matchingPrefs.length > 0) {
    reasons.push(`Matchar: ${matchingPrefs.join(", ")}`);
  }

  // Check category
  if (rider.categoriesWanted.includes(product.category)) {
    reasons.push(`Kategori: ${product.category}`);
  }

  // Check vibe
  const matchingVibes = rider.vibeTags.filter((vibe) =>
    product.tags.some((tag) => tag.includes(vibe))
  );
  if (matchingVibes.length > 0) {
    reasons.push(`Vibe: ${matchingVibes.join(", ")}`);
  }

  // Festival fit
  if (product.festivalFit >= 4) {
    reasons.push("Perfekt för festival");
  }

  if (reasons.length === 0) {
    reasons.push("Bra allmänt val");
  }

  return reasons;
}

/**
 * Calculate match score between user's rider and a celebrity rider.
 */
export function calculateCelebrityMatchScore(
  userRider: ParsedRider,
  celebrityRider: ParsedRider
): MatchScore {
  let preferenceMatch = 0;
  let allergenConflict = 0;
  let categoryMatch = 0;
  let vibeMatch = 0;

  // Preference matching
  const commonPreferences = userRider.preferences.filter((pref) =>
    celebrityRider.preferences.includes(pref)
  );
  preferenceMatch = Math.min(
    100,
    (commonPreferences.length / Math.max(userRider.preferences.length, 1)) * 100
  );

  // Allergen conflict (should be low)
  const commonAllergens = userRider.allergensAvoid.filter((allergen) =>
    celebrityRider.allergensAvoid.includes(allergen)
  );
  allergenConflict = Math.min(
    100,
    (commonAllergens.length / Math.max(userRider.allergensAvoid.length, 1)) * 100
  );

  // Category matching
  const commonCategories = userRider.categoriesWanted.filter((cat) =>
    celebrityRider.categoriesWanted.includes(cat)
  );
  categoryMatch = Math.min(
    100,
    (commonCategories.length / Math.max(userRider.categoriesWanted.length, 1)) *
      100
  );

  // Vibe matching
  const commonVibes = userRider.vibeTags.filter((vibe) =>
    celebrityRider.vibeTags.includes(vibe)
  );
  vibeMatch = Math.min(
    100,
    (commonVibes.length / Math.max(userRider.vibeTags.length, 1)) * 100
  );

  // Total score (weighted average)
  const total = Math.round(
    preferenceMatch * 0.35 +
      categoryMatch * 0.25 +
      vibeMatch * 0.2 +
      (100 - allergenConflict) * 0.1 +
      20 // Base score
  );

  return {
    total: Math.min(100, Math.max(0, total)),
    preferenceMatch: Math.round(preferenceMatch),
    allergenConflict: Math.round(allergenConflict),
    categoryMatch: Math.round(categoryMatch),
    vibeMatch: Math.round(vibeMatch),
  };
}

/**
 * Calculate balance of cart (snacks, drinks, protein, veg).
 */
export function calculateCartBalance(products: Product[]): {
  snacks: number;
  drinks: number;
  protein: number;
  veg: number;
} {
  const total = products.length || 1;

  const snacks = products.filter(
    (p) =>
      p.category === "snacks" ||
      p.category === "godis" ||
      p.category === "choklad"
  ).length;

  const drinks = products.filter(
    (p) =>
      p.category === "energidryck" ||
      p.category === "kaffe" ||
      p.category === "alkoholfritt" ||
      p.category === "sportdryck" ||
      p.category === "te" ||
      p.category === "vatten"
  ).length;

  const protein = products.filter(
    (p) =>
      p.category === "proteinbar" ||
      p.tags.includes("protein") ||
      p.category === "mejeri"
  ).length;

  const veg = products.filter(
    (p) => p.category === "frukt" || p.category === "vego"
  ).length;

  return {
    snacks: Math.round((snacks / total) * 100),
    drinks: Math.round((drinks / total) * 100),
    protein: Math.round((protein / total) * 100),
    veg: Math.round((veg / total) * 100),
  };
}

