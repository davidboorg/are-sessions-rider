# Åre Sessions - Rider Builder 🎉

En digital tjänst för Åre Sessions där besökare kan skapa sin egen festival rider och matcha den mot livsmedelsprodukter. Mobil-först, festivalvänligt flöde med mycket delbar rider card.

## ✨ Funktioner

- **Rider Upload/Input**: Ladda upp text/PDF eller skriv in manuellt
- **Smart Parsing**: Tolkar rider-text till strukturerade behov (dryck, snacks, allergier, preferenser, vibe)
- **Produktkatalog**: 80+ mockade produkter med kategorier, taggar, allergener, prisnivå
- **Rekommendationer**: AI-inspirerad matchning mellan rider och produkter
- **Bygg Rider-korg**: Sök, filtrera och bygg din perfekta rider med balansmeter
- **Delbar Rider Card**: Generera snygg PNG-bild + delningslänk
- **Celebrity Riders**: Molly Sandén och Oskar Linnros (fiktiva/inspirerade exempel)
- **Match Score**: Jämför din rider mot celebrities (0-100%)
- **Kiosk Mode**: Touch-optimerat läge med auto-reset för stationer i backen

## 🚀 Kom igång

### Förutsättningar

- Node.js 18+ 
- npm eller yarn

### Installation

```bash
npm install
```

### Utveckling

```bash
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) i din webbläsare.

### Bygga för produktion

```bash
npm run build
npm start
```

## 📁 Filstruktur

```
/
├── app/
│   ├── page.tsx                 # Landningssida
│   ├── create/page.tsx          # Rider input & parsing
│   ├── build/page.tsx           # Produktval & korg
│   ├── card/page.tsx            # Rider card generator
│   ├── celebrity/[id]/page.tsx  # Celebrity rider viewer
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── Button.tsx               # Button komponent
│   ├── Chip.tsx                 # Chip/tag komponent
│   ├── ProductCard.tsx          # Produktkort
│   ├── CelebrityCard.tsx        # Celebrity rider card
│   └── BalanceMeter.tsx         # Korg-balansmeter
├── lib/
│   ├── rider-parser.ts          # Rider parsing logik
│   └── scoring.ts               # Match score & rekommendationer
├── data/
│   ├── products.json            # 80 produkter
│   └── celebrity-riders.json   # Molly & Oskar
├── types/
│   └── index.ts                 # TypeScript interfaces
└── README.md
```

## 🛠️ Hur man lägger till produkter

Redigera `data/products.json`:

```json
{
  "id": "p081",
  "name": "Produktnamn",
  "brand": "Varumärke",
  "category": "kategori",
  "tags": ["tag1", "tag2", "tag3"],
  "allergens": ["allergen1"],
  "priceTier": 2,
  "festivalFit": 4,
  "description": "Beskrivning (optional)"
}
```

**Kategorier**: energidryck, kaffe, alkoholfritt, snacks, proteinbar, frukt, vego, glutenfritt, mejeri, godis, sportdryck, te, vatten, choklad

**Tags**: Fria taggar som matchar användarpreferenser (t.ex: vegan, protein, energi, cozy, premium)

**priceTier**: 1 (budget), 2 (mellan), 3 (premium)

**festivalFit**: 1-5 (hur bra passar produkten för festival)

## 🎭 Celebrity Riders

Redigera `data/celebrity-riders.json` för att ändra eller lägga till celebrity riders.

Varje celebrity rider har:
- **parsedRider**: Strukturerad rider (preferenser, allergener, kategorier, vibe)
- **suggestedProducts**: Lista med produkt-ID:n
- **disclaimer**: Tydlig markering att det är fiktivt/inspirerat

## 🖥️ Kiosk Mode

Aktivera kiosk-mode genom att lägga till `?mode=kiosk` i URL:en:

```
http://localhost:3000/?mode=kiosk
```

**Funktioner i kiosk-mode:**
- Större touch targets (60x60px minimum)
- Auto-reset efter 60 sekunders inaktivitet
- QR-kod visas på rider card för att öppna i mobil
- User-select disabled för att förhindra textmarkering

**Implementering:**
- Lägg parametern i URL:en vid alla navigeringar
- CSS-klass `.kiosk-mode` appliceras automatiskt
- Timer återställs vid användarinteraktion

## 🧠 Rider Parsing - Byta till LLM

Nuvarande implementation använder regex/heuristik (`HeuristicRiderParser`).

För att byta till LLM-baserad parsing:

1. Skapa en ny klass i `lib/rider-parser.ts`:

```typescript
export class LLMRiderParser implements RiderParser {
  async parse(text: string): Promise<ParsedRider> {
    // Anropa din LLM API (OpenAI, Anthropic, etc.)
    const response = await fetch('/api/parse-rider', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    
    return await response.json();
  }
}
```

2. Uppdatera factory-funktionen:

```typescript
export function getRiderParser(): RiderParser {
  if (process.env.NEXT_PUBLIC_USE_LLM_PARSER === 'true') {
    return new LLMRiderParser();
  }
  return new HeuristicRiderParser();
}
```

3. Skapa API-route `app/api/parse-rider/route.ts` för LLM-anrop.

## 📊 Match Score Algoritm

Match score beräknas i `lib/scoring.ts`:

### Produkt Match (0-100+)
- **Festival Fit**: +5 per poäng (1-5)
- **Preference Match**: +15 per matchande preferens
- **Category Match**: +20 om kategori önskas
- **Vibe Match**: +10 per matchande vibe-tag
- **Allergen Conflict**: -100 (exkluderar produkten)
- **Budget Tier Diff**: -5 per steg från önskad budget

### Celebrity Match (0-100%)
- **Preference Match**: 35% vikt
- **Category Match**: 25% vikt
- **Vibe Match**: 20% vikt
- **Allergen Overlap**: 10% vikt (bonus för samma allergier)
- **Base Score**: 20%

## 🎨 Design & UX

**Färgschema:**
- Primary: `#FF6B35` (orange)
- Secondary: `#004E89` (blå)
- Accent: `#F7B801` (gul)
- Dark: `#1A1A2E`
- Light: `#FAFAFA`

**Animationer:**
- Framer Motion för smooth transitions
- Fade-in, slide-up, bounce-subtle
- Loading states på alla async actions

**Tillgänglighet:**
- Semantisk HTML
- ARIA-labels på interaktiva element
- Tangentbordsnavigering
- Kontrast enligt WCAG AA

## 📱 Mobil-först

Alla komponenter är byggda mobil-först med Tailwind's responsive breakpoints:
- `md:` (768px+) för tablet
- `lg:` (1024px+) för desktop

Touch targets är minimum 44x44px (60x60px i kiosk-mode).

## 🔐 Data & Privacy

**Nuvarande implementation:**
- All data lagras i `sessionStorage` (rensas vid stängd flik)
- Ingen backend-persistering
- Ingen användarautentisering

**För produktion:**
- Implementera auth (NextAuth.js)
- Spara riders i databas (Supabase/Postgres)
- Generera unika share-länkar
- Analytics (Plausible/Posthog)

## 📦 Dependencies

**Core:**
- Next.js 15 (App Router)
- React 18
- TypeScript 5

**UI & Animation:**
- Tailwind CSS 3
- Framer Motion 11
- Lucide React (icons)

**Utilities:**
- html-to-image (rider card export)

## 🚧 Nästa steg

### Kort sikt
- [ ] PDF text-extraktion (pdf-parse eller pdf.js)
- [ ] QR-kod generering (qrcode.react)
- [ ] Faktisk share URL med unik ID
- [ ] Förbättrad bildexport (högre kvalitet, fler alternativ)

### Mellan sikt
- [ ] Analytics integration (spåra populära produkter, vibe-tags)
- [ ] User authentication (NextAuth.js)
- [ ] Spara riders till databas
- [ ] Admin-panel för produkthantering
- [ ] A/B-testing av rekommendationer

### Lång sikt
- [ ] Produktscanning med streckkod (QuaggaJS)
- [ ] Sponsor-integration (märk sponsrade produkter)
- [ ] Riktig produktfeed från leverantör-API
- [ ] Beställningsfunktion (skicka rider direkt till leverantör)
- [ ] Social features (dela, gilla, kommentera riders)
- [ ] Internationalisering (i18n för flera språk)

## 🐛 Troubleshooting

**Problem: "Cannot find module" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem: Tailwind styles inte applicerade**
```bash
npm run dev
# Starta om dev-servern
```

**Problem: Bild-export fungerar inte**
- Kontrollera att alla element i rider card är synliga
- Vissa CSS-effekter (blur, shadow) kan vara buggy i html-to-image
- Testa med `pixelRatio: 1` istället för 2

**Problem: sessionStorage töms**
- sessionStorage rensas när användaren stänger fliken
- För persistent data, använd localStorage eller databas

## 📄 Licens

Detta är ett kreativt demo-projekt för Åre Sessions. Alla celebrity riders är fiktiva exempel och inte officiella.

## 👥 Kontakt

För frågor eller support, kontakta utvecklingsteamet.

---

**Byggt med ❤️ för Åre Sessions 2025**

