import { ParsedRider, RiderParser } from "@/types";

/**
 * Keyword patterns with weights for scoring
 */
interface KeywordPattern {
  pattern: RegExp;
  weight: number;
}

interface PatternConfig {
  [key: string]: KeywordPattern;
}

/**
 * Heuristic-based rider parser using regex and keyword matching with scoring.
 * Implements the RiderParser interface to allow easy swapping to LLM later.
 */
export class HeuristicRiderParser implements RiderParser {
  // Scoring weights
  private static readonly WEIGHTS = {
    exactMatch: 1.0,
    partialMatch: 0.5,
    contextBonus: 0.3,
  };

  async parse(text: string): Promise<ParsedRider> {
    const lowerText = text.toLowerCase();
    const normalizedText = this.normalizeText(lowerText);

    return {
      peopleCount: this.extractPeopleCount(normalizedText),
      budgetTier: this.extractBudgetTier(normalizedText),
      preferences: this.extractPreferences(normalizedText),
      allergensAvoid: this.extractAllergens(normalizedText),
      categoriesWanted: this.extractCategories(normalizedText),
      vibeTags: this.extractVibeTags(normalizedText),
      rawText: text,
    };
  }

  /**
   * Parse with confidence scores for each extracted field
   */
  async parseWithConfidence(text: string): Promise<{
    rider: ParsedRider;
    confidence: {
      peopleCount: number;
      budgetTier: number;
      preferences: number;
      allergens: number;
      categories: number;
      vibe: number;
      overall: number;
    };
  }> {
    const rider = await this.parse(text);
    const normalizedText = this.normalizeText(text.toLowerCase());

    const confidence = {
      peopleCount: this.calculatePeopleConfidence(normalizedText, rider.peopleCount),
      budgetTier: this.calculateBudgetConfidence(normalizedText, rider.budgetTier),
      preferences: this.calculateArrayConfidence(rider.preferences),
      allergens: this.calculateArrayConfidence(rider.allergensAvoid),
      categories: this.calculateArrayConfidence(rider.categoriesWanted),
      vibe: this.calculateArrayConfidence(rider.vibeTags),
      overall: 0,
    };

    // Calculate overall confidence as weighted average
    confidence.overall =
      (confidence.peopleCount * 0.15 +
        confidence.budgetTier * 0.1 +
        confidence.preferences * 0.25 +
        confidence.allergens * 0.2 +
        confidence.categories * 0.2 +
        confidence.vibe * 0.1);

    return { rider, confidence };
  }

  /**
   * Normalize Swedish text: handle special chars, common variations
   */
  private normalizeText(text: string): string {
    return text
      .replace(/[åä]/g, "a")
      .replace(/ö/g, "o")
      .replace(/é/g, "e")
      .replace(/\s+/g, " ")
      .trim();
  }

  private extractPeopleCount(text: string): number | undefined {
    // Patterns ordered by specificity
    const patterns: Array<{ pattern: RegExp; groupIndex: number }> = [
      { pattern: /(\d+)\s*(?:personer|person|pers|st|stycken)/, groupIndex: 1 },
      { pattern: /(?:for|för)\s*(\d+)/, groupIndex: 1 },
      { pattern: /(\d+)\s*(?:man|kvinnor|gaister|guests|people)/, groupIndex: 1 },
      { pattern: /vi\s+ar\s+(\d+)/, groupIndex: 1 }, // "vi är X"
      { pattern: /(\d+)\s+vanner/, groupIndex: 1 }, // "X vänner"
      { pattern: /mig\s+och\s+(\d+)/, groupIndex: 1 }, // "mig och X" → means X+1
    ];

    for (const { pattern, groupIndex } of patterns) {
      const match = text.match(pattern);
      if (match && match[groupIndex]) {
        let count = parseInt(match[groupIndex], 10);

        // "mig och X" means total is X+1
        if (pattern.source.includes("mig\\s+och")) {
          count += 1;
        }

        if (count > 0 && count < 100) return count;
      }
    }

    // Check for implicit single person
    if (/\b(bara jag|endast jag|solo|ensam)\b/.test(text)) {
      return 1;
    }

    return undefined;
  }

  private extractBudgetTier(text: string): 1 | 2 | 3 | undefined {
    const budgetPatterns = {
      low: {
        pattern: /budget|billig|ekonom|lag\s*kostnad|cheap|inte\s*dyr|spara|prisv.rd/i,
        tier: 1 as const,
        score: 0,
      },
      high: {
        pattern: /lyx|premium|exklusiv|dyr|luxury|high.?end|pengar.*(ingen|spelar\s*ingen)\s*roll|bast(a)?/i,
        tier: 3 as const,
        score: 0,
      },
      medium: {
        pattern: /mellan|medium|normal|standard|lagom|varken.*eller/i,
        tier: 2 as const,
        score: 0,
      },
    };

    // Score each tier based on matches
    for (const [, config] of Object.entries(budgetPatterns)) {
      const matches = text.match(new RegExp(config.pattern, "gi"));
      if (matches) {
        config.score = matches.length;
      }
    }

    // Return tier with highest score
    const sorted = Object.values(budgetPatterns).sort((a, b) => b.score - a.score);
    if (sorted[0].score > 0) {
      return sorted[0].tier;
    }

    return undefined;
  }

  private extractPreferences(text: string): string[] {
    const preferences: Map<string, number> = new Map();

    const patterns: PatternConfig = {
      vegan: { pattern: /vegan|vaxtbaserad|plant.?based|vegansk/, weight: 1.0 },
      vegetarian: { pattern: /vegetarian|vegetarisk|veggo|lacto.?ovo/, weight: 1.0 },
      glutenfritt: { pattern: /gluten.?fr|glutenfritt|celiak|spannmals.?fri/, weight: 1.0 },
      laktosfritt: { pattern: /laktos.?fr|laktosfritt|dairy.?free|mjolk.?fri/, weight: 1.0 },
      alkoholfritt: { pattern: /alkohol.?fr|alkoholfritt|non.?alcoholic|ingen\s*alkohol|nykter/, weight: 1.0 },
      eko: { pattern: /ekologisk|eko|organic|krav.?markt/, weight: 0.8 },
      halsosam: { pattern: /halsosam|healthy|nyttig|wellness|halso/, weight: 0.8 },
      energi: { pattern: /energi|energy|boost|koffein|caffeine|vaken|pigg/, weight: 0.9 },
      protein: { pattern: /protein|high.?protein|muskel|gains|traning/, weight: 0.9 },
      lyxig: { pattern: /lyx|lyxig|premium|exklusiv|luxury|finare/, weight: 0.8 },
      minimalistisk: { pattern: /minimal|enkelt|clean|simpel|avskalat|lite/, weight: 0.7 },
      festlig: { pattern: /fest|party|festlig|celebrate|fira|kalas/, weight: 0.9 },
      cozy: { pattern: /cozy|mysig|warm|comfort|mys|varmt/, weight: 0.8 },
      focus: { pattern: /fokus|focus|koncentration|concentration|skarp/, weight: 0.8 },
      raw: { pattern: /raw|ra|naturell|natural|obehandlad/, weight: 0.7 },
      bubbel: { pattern: /bubbel|champagne|prosecco|sparkling|cava/, weight: 0.9 },
      sockerfritt: { pattern: /socker.?fr|sockerfritt|sugar.?free|lag.?socker|no\s*sugar/, weight: 0.8 },
      hallbar: { pattern: /hallbar|sustainable|miljovanlig|klimatsmart/, weight: 0.7 },
      lokal: { pattern: /lokal|svenskt|svensk|narproducerad|nordisk/, weight: 0.7 },
    };

    for (const [key, config] of Object.entries(patterns)) {
      const matches = text.match(new RegExp(config.pattern, "gi"));
      if (matches) {
        preferences.set(key, (preferences.get(key) || 0) + matches.length * config.weight);
      }
    }

    // Return preferences sorted by score, filtered to non-zero
    return Array.from(preferences.entries())
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([pref]) => pref);
  }

  private extractAllergens(text: string): string[] {
    const allergens: string[] = [];

    // Look for allergy indicators first
    const hasAllergyContext = /allergi|tallig\s*inte|undvik|kan\s*inte\s*ata|kanslig|intoleran/i.test(text);

    const patterns: PatternConfig = {
      notter: { pattern: /not(?:ter|allergi)|nut\s*allergy|peanut|mandel\s*allergi|jordnot|hasselnot/, weight: 1.0 },
      mjolk: { pattern: /mjolk(?:allergi|protein)|dairy\s*allergy|laktos(?:intoleran)?/, weight: 1.0 },
      gluten: { pattern: /gluten(?:allergi)?|celiaki|celiac|vete(?:allergi)?/, weight: 1.0 },
      agg: { pattern: /agg(?:allergi)?|egg\s*allergy/, weight: 1.0 },
      soja: { pattern: /soja(?:allergi)?|soy\s*allergy/, weight: 1.0 },
      sesamfron: { pattern: /sesam(?:fron)?|sesame/, weight: 1.0 },
      skaldjur: { pattern: /skaldjur|shellfish|rakallerg/, weight: 1.0 },
      fisk: { pattern: /fisk(?:allergi)?|fish\s*allergy/, weight: 1.0 },
      jordnotteR: { pattern: /jordnot(?:ter)?(?:allergi)?|peanut/, weight: 1.0 },
      selleri: { pattern: /selleri|celery/, weight: 1.0 },
      senap: { pattern: /senap|mustard/, weight: 1.0 },
      lupin: { pattern: /lupin/, weight: 1.0 },
      blotdjur: { pattern: /blotdjur|mollusc/, weight: 1.0 },
    };

    for (const [key, config] of Object.entries(patterns)) {
      if (config.pattern.test(text)) {
        // Higher confidence if allergy context is present
        if (hasAllergyContext) {
          allergens.push(key);
        } else {
          // Still add but with lower priority (user might be mentioning preference, not allergy)
          allergens.push(key);
        }
      }
    }

    return allergens;
  }

  private extractCategories(text: string): string[] {
    const categories: Map<string, number> = new Map();

    const patterns: PatternConfig = {
      energidryck: { pattern: /energidryck|energy\s*drink|red\s*bull|monster|celsius|nocco\s*energi/, weight: 1.0 },
      kaffe: { pattern: /kaffe|coffee|espresso|latte|cappuccino|bryggkaffe|cold\s*brew/, weight: 1.0 },
      alkoholfritt: { pattern: /alkohol.?fr|non.?alcoholic|mocktail|0%|bubbel/, weight: 1.0 },
      snacks: { pattern: /snacks|chips|nacho|popcorn|tilltugg|godis|jordnot/, weight: 0.9 },
      proteinbar: { pattern: /protein.?bar|proteinbar|bars/, weight: 1.0 },
      frukt: { pattern: /frukt|fruit|bar|berries|smoothie|jordgubb|banan|appel/, weight: 0.9 },
      vego: { pattern: /vego|vegan|vegetarisk|vaxtbaserat/, weight: 1.0 },
      glutenfritt: { pattern: /gluten.?fr|gluten.?free|celiaki/, weight: 1.0 },
      mejeri: { pattern: /mejeri|yoghurt|ost|cheese|dairy|mjolk|kvarg/, weight: 0.9 },
      godis: { pattern: /godis|candy|sotsaker|sweets|choklad/, weight: 0.8 },
      sportdryck: { pattern: /sportdryck|gatorade|elektrolyt|powerade|vitamin\s*well/, weight: 1.0 },
      te: { pattern: /\bte\b|tea|chai|iste|ortte|matcha/, weight: 1.0 },
      vatten: { pattern: /vatten|water|mineral|kolsyr|ramlosa|loka/, weight: 0.8 },
      choklad: { pattern: /choklad|chocolate|cocoa|kakao|mork\s*choklad/, weight: 0.9 },
    };

    for (const [key, config] of Object.entries(patterns)) {
      const matches = text.match(new RegExp(config.pattern, "gi"));
      if (matches) {
        categories.set(key, (categories.get(key) || 0) + matches.length * config.weight);
      }
    }

    return Array.from(categories.entries())
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  }

  private extractVibeTags(text: string): string[] {
    const tags: Map<string, number> = new Map();

    const patterns: PatternConfig = {
      warm: { pattern: /warm|varm|mysig|cozy|ombonad/, weight: 1.0 },
      glam: { pattern: /glam|glamoros|lyxig|elegant|snygg|chic/, weight: 1.0 },
      clean: { pattern: /clean|ren|minimalist|avskalad|simpel/, weight: 1.0 },
      focused: { pattern: /fokus|focus|koncentration|skarp|alert/, weight: 1.0 },
      festlig: { pattern: /fest|party|celebrate|fira|glad|happy/, weight: 1.0 },
      energisk: { pattern: /energisk|energetic|active|aktiv|peppad/, weight: 1.0 },
      lugn: { pattern: /lugn|calm|relax|chill|avslappnad|zen/, weight: 1.0 },
      trendig: { pattern: /trendig|trendy|hipster|modern|inne/, weight: 0.9 },
      klassisk: { pattern: /klassisk|classic|traditional|traditionell|tidlos/, weight: 0.9 },
      kreativ: { pattern: /kreativ|creative|artistisk|konstnärlig/, weight: 0.8 },
      sportig: { pattern: /sportig|athletic|traning|workout|fitness/, weight: 0.9 },
      bohemisk: { pattern: /bohemisk|boho|hippie|fri|frihet/, weight: 0.8 },
      professionell: { pattern: /professionell|business|serios|formell/, weight: 0.8 },
    };

    for (const [key, config] of Object.entries(patterns)) {
      const matches = text.match(new RegExp(config.pattern, "gi"));
      if (matches) {
        tags.set(key, (tags.get(key) || 0) + matches.length * config.weight);
      }
    }

    return Array.from(tags.entries())
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }

  // Confidence calculation helpers
  private calculatePeopleConfidence(text: string, count: number | undefined): number {
    if (!count) return 0;
    // Higher confidence if explicit number mentioned
    if (/\d+\s*(personer|person|pers)/.test(text)) return 0.95;
    if (/\d+/.test(text)) return 0.7;
    return 0.5;
  }

  private calculateBudgetConfidence(text: string, tier: 1 | 2 | 3 | undefined): number {
    if (!tier) return 0;
    // Check for explicit budget mentions
    const budgetMentions = (text.match(/budget|lyx|premium|billig|ekonom|pengar/gi) || []).length;
    return Math.min(0.9, 0.4 + budgetMentions * 0.2);
  }

  private calculateArrayConfidence(arr: string[]): number {
    if (!arr || arr.length === 0) return 0;
    // More matches = higher confidence
    return Math.min(0.95, 0.3 + arr.length * 0.1);
  }
}

/**
 * Factory function to get the current parser.
 * Makes it easy to swap to an LLM-based parser later.
 */
export function getRiderParser(): RiderParser {
  // In the future, this could check an env variable:
  // if (process.env.USE_LLM_PARSER === 'true') {
  //   return new LLMRiderParser();
  // }
  return new HeuristicRiderParser();
}

/**
 * Quick parse function for simple use cases
 */
export async function parseRiderText(text: string): Promise<ParsedRider> {
  const parser = getRiderParser();
  return parser.parse(text);
}

/**
 * Parse with confidence scores
 */
export async function parseRiderWithConfidence(text: string) {
  const parser = new HeuristicRiderParser();
  return parser.parseWithConfidence(text);
}

export default HeuristicRiderParser;
