import { ParsedRider, RiderParser } from "@/types";

/**
 * Heuristic-based rider parser using regex and keyword matching.
 * Implements the RiderParser interface to allow easy swapping to LLM later.
 */
export class HeuristicRiderParser implements RiderParser {
  async parse(text: string): Promise<ParsedRider> {
    const lowerText = text.toLowerCase();

    return {
      peopleCount: this.extractPeopleCount(lowerText),
      budgetTier: this.extractBudgetTier(lowerText),
      preferences: this.extractPreferences(lowerText),
      allergensAvoid: this.extractAllergens(lowerText),
      categoriesWanted: this.extractCategories(lowerText),
      vibeTags: this.extractVibeTags(lowerText),
      rawText: text,
    };
  }

  private extractPeopleCount(text: string): number | undefined {
    // Look for patterns like "2 personer", "för 3", "3 people", etc
    const patterns = [
      /(\d+)\s*(?:personer|person|people|pers)/,
      /(?:för|for)\s*(\d+)/,
      /(\d+)\s*(?:man|kvinnor|guests)/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const count = parseInt(match[1]);
        if (count > 0 && count < 100) return count;
      }
    }

    return undefined;
  }

  private extractBudgetTier(text: string): 1 | 2 | 3 | undefined {
    if (
      /budget|billig|ekonomisk|låg kostnad|cheap/i.test(text)
    ) {
      return 1;
    }
    if (
      /lyx|premium|exklusiv|dyr|luxury|high.?end/i.test(text)
    ) {
      return 3;
    }
    if (/mellan|medium|normal|standard/i.test(text)) {
      return 2;
    }

    return undefined;
  }

  private extractPreferences(text: string): string[] {
    const preferences: string[] = [];
    const patterns = {
      vegan: /vegan|växtbaserad|plant.?based/,
      vegetarian: /vegetarian|vegetarisk|veggo/,
      glutenfritt: /gluten.?fr[iy]|glutenfritt|celiac/,
      laktosfritt: /laktos.?fr[iy]|laktosfritt|dairy.?free/,
      alkoholfritt: /alkohol.?fr[iy]|alkoholfritt|non.?alcoholic|no alcohol/,
      eko: /ekologisk|eko|organic/,
      hälsosam: /hälsosam|healthy|nyttig|wellness/,
      energi: /energi|energy|boost|koffein|caffeine/,
      protein: /protein|high.?protein|muskel/,
      lyxig: /lyx|lyxig|premium|exklusiv|luxury/,
      minimalistisk: /minimal|enkelt|clean|simpel/,
      festlig: /fest|party|festlig|celebrate/,
      cozy: /cozy|mysig|warm|comfort/,
      focus: /fokus|focus|koncentration|concentration/,
      raw: /raw|rå|naturell|natural/,
      bubbel: /bubbel|champagne|prosecco|sparkling/,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      if (pattern.test(text)) {
        preferences.push(key);
      }
    });

    return preferences;
  }

  private extractAllergens(text: string): string[] {
    const allergens: string[] = [];
    const patterns = {
      nötter: /nöt(?:ter|allergi)|nut allergy|peanut|mandel allergi/,
      mjölk: /mjölk(?:allergi|protein)|dairy allergy|laktos(?:intolerant)?/,
      gluten: /gluten|celiaki|celiac/,
      ägg: /ägg(?:allergi)?|egg allergy/,
      soja: /soja|soy allergy/,
      sesamfrön: /sesam|sesame/,
      skaldjur: /skaldjur|shellfish/,
      fisk: /fisk(?:allergi)?|fish allergy/,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      if (pattern.test(text)) {
        allergens.push(key);
      }
    });

    return allergens;
  }

  private extractCategories(text: string): string[] {
    const categories: string[] = [];
    const patterns = {
      energidryck: /energidryck|energy drink|red bull|monster/,
      kaffe: /kaffe|coffee|espresso|latte|cappuccino/,
      alkoholfritt: /alkoholfr[iy]|non.?alcoholic|mocktail/,
      snacks: /snacks|chips|nacho|popcorn/,
      proteinbar: /protein.?bar|proteinbar/,
      frukt: /frukt|fruit|bär|berries|smoothie/,
      vego: /vego|vegan|vegetarisk/,
      glutenfritt: /glutenfr[iy]|gluten.?free/,
      mejeri: /mejeri|yoghurt|ost|cheese|dairy/,
      godis: /godis|candy|sötsaker|sweets/,
      sportdryck: /sportdryck|gatorade|elektrolyt/,
      te: /te[^a-z]|tea|chai/,
      vatten: /vatten|water|mineralvatten/,
      choklad: /choklad|chocolate|cocoa/,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      if (pattern.test(text)) {
        categories.push(key);
      }
    });

    return categories;
  }

  private extractVibeTags(text: string): string[] {
    const tags: string[] = [];
    const patterns = {
      warm: /warm|varm|mysig|cozy/,
      glam: /glam|glamorös|lyxig|elegant/,
      clean: /clean|ren|minimalist/,
      focused: /fokus|focus|koncentration/,
      festlig: /fest|party|celebrate/,
      energisk: /energisk|energetic|active/,
      lugn: /lugn|calm|relax|chill/,
      trendig: /trendig|trendy|hipster|modern/,
      klassisk: /klassisk|classic|traditional/,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      if (pattern.test(text)) {
        tags.push(key);
      }
    });

    return tags;
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

