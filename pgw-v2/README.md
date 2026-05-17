# PayGateway — Frontend Redesign (v2.1)

Complete visual overhaul of the merchant dashboard. **Zero backend changes** — every API call, endpoint, request shape, and response handler is identical to v2.0. Only `index.html`, `App.jsx`, and the 5 page components were rewritten. `AuthContext.jsx`, `services/api.js`, and `main.jsx` are untouched.

## What changed

- **Design system** — new `src/ui/theme.jsx` is the single source of truth for colors, spacing, fonts, icons, and primitive components (`Card`, `Button`, `Input`, `Select`, `Field`, `Badge`, `MetricCard`, `EmptyState`, `Toast`, `StatusDot`). Every page imports from here, so changing one token re-themes the whole app.
- **Light theme** — warm off-white background (`#FAFAF9`), white cards, indigo primary (`#4F46E5`), emerald success (`#10B981`). Black-on-white primary buttons feel premium and signal trust.
- **Typography** — Inter for UI, JetBrains Mono for IDs and code. Replaces DM Sans/DM Mono.
- **Auth (Onboarding)** — moved away from split-screen. Now uses a centered card on an ambient dotted grid with concentric ring decorations. The top-right header changes context per view (status badge on login, "Already have an account?" on signup, "Back to sign in" on forgot/reset).
- **App shell** — refined sidebar with a merchant switcher block at top, grouped nav ("Overview" / "Account"), persistent "All systems normal" footer indicator. Sticky frosted topbar shows page title + subtitle + today's date + ops status pill.
- **Dashboard** — proper metric cards with conditional coloring, bank usage as progress bars (not a "no data" message), system status with port + green dot per service, today's recon callout inside the status card.
- **Payments** — quick stats row, collapsible initiate form with inline result preview, dedicated "Poll status" panel with auto-fill behavior, filter chips (All / Succeeded / Processing / Failed / Initiated) instead of a dropdown, clean pagination.
- **Reconciliation** — date picker + run/fetch/export buttons on one row, 4 metric cards with colored left-borders matching severity, success/error banners, mismatch table with badges, history table with click-to-load.
- **Webhooks** — 4 stat cards (Delivered / Failed / Pending / Total), table-based delivery logs (replaces the timeline), clickable ID badges that auto-fill the retry box, retry policy shown as 4 tiles.

## Stack (unchanged)

React 18 + Vite 5, plain React (no Tailwind, no router). All styling inline via the theme primitives. Same dependencies as before.

## Run locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serve the build
```

## File map

```
src/
├── App.jsx                    # shell: sidebar + topbar + page switcher
├── main.jsx                   # entry (UNCHANGED)
├── ui/
│   └── theme.jsx              # design system (NEW)
├── context/
│   └── AuthContext.jsx        # JWT + merchant state (UNCHANGED)
├── services/
│   └── api.js                 # all backend calls (UNCHANGED)
└── pages/
    ├── OnboardingPage.jsx     # login / signup / forgot / reset
    ├── DashboardPage.jsx      # metrics + bank usage + system + recents
    ├── PaymentsPage.jsx       # initiate + poll + list
    ├── ReconPage.jsx          # trigger + summary + mismatches + history
    └── WebhooksPage.jsx       # stats + logs + retry + policy
```

## Backend contract

All endpoints, request bodies, response shapes, headers (`Authorization`, `Idempotency-Key`), and error handling are identical to v2.0. Drop these files into your existing repo and rebuild — no backend redeploy needed.
