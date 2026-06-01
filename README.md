# Budget Tracker

A simple personal budget tracker built with Vite, React, TypeScript, Tailwind CSS, Supabase Auth, and a secured Supabase Postgres table. It is designed to deploy as a static site on the Vercel Hobby/free plan.

## Features

- Email/password sign in and sign up with Supabase Auth
- One dashboard for monthly income, essentials, non-essential spending, and savings
- 50/30/20 budget targets with progress bars
- CRUD for every transaction category
- Per-account subcategories for income, essentials, savings, and non-essentials
- Category pie charts on monthly cards
- Month and year selector
- Annual report dashboard with bar graphs
- Calendar with daily transaction indicators
- Daily log with edit and delete controls
- PHP currency formatting by default
- Supabase persistence with row-level security
- Per-account editable budget target split, defaulting to 50/30/20
- Per-card subcategory management with archive-safe history

## Important Security Note

This app is still a static frontend, but authentication and transaction access are handled by Supabase Auth and row-level security. Only use the public anon/publishable key in frontend and Vercel environment variables. Never expose or commit a Supabase service-role key.

## Local Setup

Install dependencies:

```bash
npm install
```

If PowerShell blocks `npm.ps1` on Windows, use:

```bash
cmd /c npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set your Supabase project values:

```env
VITE_SUPABASE_URL=https://xxysgewzuubzexherhbh.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
VITE_BUDGET_CURRENCY=PHP
```

Run the app:

```bash
npm run dev
```

Or on Windows with restricted PowerShell scripts:

```bash
cmd /c npm run dev
```

## Verification

Run tests:

```bash
npm test
```

Run the production build:

```bash
npm run build
```

Windows alternatives:

```bash
cmd /c npm test
cmd /c npm run build
```

## Vercel Hobby/Free Deployment

This app deploys as a static Vite site. No server functions, filesystem writes, or service-role keys are required.

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Use the Vite framework preset.
4. Add these environment variables in Vercel Project Settings:

```env
VITE_SUPABASE_URL=https://xxysgewzuubzexherhbh.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
VITE_BUDGET_CURRENCY=PHP
```

5. Deploy.

The included `vercel.json` sets:

- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`

## Data Storage

Transactions are stored in Supabase in `public.transactions`. Budget target settings are stored in `public.budget_preferences`. User-managed subcategories are stored in `public.transaction_subcategories`. Row-level security limits each authenticated user to their own rows.

The table and RLS setup SQL is checked in under `supabase/migrations/`. Apply those SQL files to the `supabase-budget-tracker` project before using the app. Existing browser `localStorage` data from older versions is left untouched but is no longer used.

Subcategories start empty for each account. Use the `Manage` button on any category card to add active subcategories. Archiving a subcategory removes it from future forms, but existing transactions using that label remain visible in the dashboard.

Users can create an account from the app with email/password. If email confirmation is enabled in Supabase Auth, new users will need to confirm their email before signing in.

## Currency

The app defaults to PHP. To change it later, set `VITE_BUDGET_CURRENCY` to another ISO currency code and rebuild the app.
