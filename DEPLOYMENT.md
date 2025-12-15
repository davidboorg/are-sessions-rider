# Deployment Guide - Åre Sessions Rider Builder

## Vercel (Rekommenderat)

1. Skapa konto på [vercel.com](https://vercel.com)
2. Installera Vercel CLI:
   ```bash
   npm i -g vercel
   ```
3. Deploy:
   ```bash
   vercel
   ```
4. Följ instruktionerna för att länka projektet

### Environment Variables på Vercel

Om du använder LLM-parsing eller andra externa tjänster:
```bash
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
```

## Netlify

1. Skapa konto på [netlify.com](https://netlify.com)
2. Installera Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```
3. Deploy:
   ```bash
   netlify deploy --prod
   ```

## Railway

1. Skapa konto på [railway.app](https://railway.app)
2. Skapa nytt projekt från GitHub repo
3. Railway detekterar automatiskt Next.js och deployar

## Docker (Self-hosted)

1. Skapa `Dockerfile`:
   ```dockerfile
   FROM node:18-alpine AS base

   WORKDIR /app
   COPY package*.json ./
   RUN npm ci

   COPY . .
   RUN npm run build

   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Bygg och kör:
   ```bash
   docker build -t rider-builder .
   docker run -p 3000:3000 rider-builder
   ```

## Performance Tips

### Image Optimization
- Lägg till produktbilder i `public/products/`
- Använd Next.js Image component
- Aktivera Vercel's image optimization

### Caching
- Produkter kan cachas aggressivt (de ändras sällan)
- Celebrity riders kan cachas i 24h
- Använd SWR eller React Query för data fetching

### Analytics
```bash
npm install @vercel/analytics
```

Lägg till i `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Custom Domain

### Vercel
1. Gå till Project Settings → Domains
2. Lägg till din domän (t.ex. `rider.aresessions.se`)
3. Uppdatera DNS enligt instruktioner

### SSL/TLS
- Vercel och Netlify ger automatiskt SSL via Let's Encrypt
- För Railway, aktivera SSL i settings

## Environment Variables för Production

```env
# .env.production
NEXT_PUBLIC_APP_URL=https://rider.aresessions.se
NEXT_PUBLIC_USE_LLM_PARSER=false

# Analytics (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=rider.aresessions.se
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Database (optional)
DATABASE_URL=postgresql://...
```

## Monitoring

### Vercel Analytics
- Automatiskt aktiverat på Vercel
- Visar besökare, page views, performance

### Sentry (Error Tracking)
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### LogRocket (Session Replay)
```bash
npm install logrocket
```

## Backup & Recovery

### Databas
Om du implementerar databas:
```bash
# Postgres backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Git Branches
- `main` - production
- `staging` - test-miljö
- `develop` - utveckling

## CI/CD Pipeline

Skapa `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm test
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Kiosk Mode Setup

### iPad/Tablet Kiosk
1. Öppna Safari/Chrome
2. Navigera till `https://rider.aresessions.se?mode=kiosk`
3. Lägg till på hemskärm
4. Aktivera Guided Access (iOS) eller Kiosk Mode (Android)

### Dedicated Device
```bash
# Raspberry Pi setup
sudo apt-get install chromium-browser unclutter
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  https://rider.aresessions.se?mode=kiosk
```

## Security Checklist

- [ ] HTTPS aktiverat
- [ ] Environment variables säkra (inte i git)
- [ ] Rate limiting för API routes
- [ ] CORS konfigurerat korrekt
- [ ] CSP headers satta
- [ ] Input sanitization

## Post-Launch

1. Övervaka performance med Lighthouse
2. Kolla analytics för användarmönster
3. Samla feedback från användare
4. Iterera på rekommendationsalgoritmen
5. A/B-testa olika UI-variants

---

**Ready to launch! 🚀**

