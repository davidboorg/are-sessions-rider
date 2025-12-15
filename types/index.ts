// Core types for Rider Builder

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  tags: string[];
  allergens: string[];
  priceTier: 1 | 2 | 3;
  festivalFit: 1 | 2 | 3 | 4 | 5;
  image?: string;
  description?: string;
}

export type ProductCategory =
  | "energidryck"
  | "kaffe"
  | "alkoholfritt"
  | "snacks"
  | "proteinbar"
  | "frukt"
  | "vego"
  | "glutenfritt"
  | "mejeri"
  | "godis"
  | "sportdryck"
  | "te"
  | "vatten"
  | "choklad";

export interface ParsedRider {
  peopleCount?: number;
  budgetTier?: 1 | 2 | 3;
  preferences: string[];
  allergensAvoid: string[];
  categoriesWanted: string[];
  vibeTags: string[];
  rawText?: string;
}

export interface CelebrityRider {
  id: string;
  name: string;
  handle: string;
  description: string;
  vibe: string;
  parsedRider: ParsedRider;
  suggestedProducts: string[]; // Product IDs
  avatar?: string;
  disclaimer: string;
}

export interface RiderCart {
  products: CartProduct[];
  createdAt: Date;
  userId?: string;
}

export interface CartProduct {
  product: Product;
  quantity: number;
  reason?: string; // Why this product matches the rider
}

export interface RiderCard {
  id: string;
  title: string;
  handle: string;
  date: string;
  products: Product[];
  allergens: string[];
  matchScores?: {
    mollySanden?: number;
    oskarLinnros?: number;
  };
  vibeTags: string[];
}

export interface MatchScore {
  total: number;
  preferenceMatch: number;
  allergenConflict: number;
  categoryMatch: number;
  vibeMatch: number;
}

export interface ProductRecommendation {
  product: Product;
  score: number;
  reasons: string[];
}

// Parser interface - allows swapping to LLM later
export interface RiderParser {
  parse(text: string): Promise<ParsedRider>;
}

// Kiosk mode config
export interface KioskConfig {
  enabled: boolean;
  inactivityTimeout: number; // seconds
  touchTargetMultiplier: number;
}

