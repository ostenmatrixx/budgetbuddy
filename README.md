# Budget Tracker

A simple personal budget tracker built with Vite, React, TypeScript, Tailwind CSS, Supabase Auth, and a secured Supabase Postgres table. It is designed to deploy as a static site on the Vercel Hobby/free plan.

## Features

- Email/password sign in and sign up with Supabase Auth
- One dashboard for monthly income, essentials, non-essential spending, and savings
- 50/30/20 budget targets with progress bars
- CRUD for every transaction category
- Essentials and savings subcategories
- Category pie charts on monthly cards
- Month and year selector
- Annual report dashboard with bar graphs
- Calendar with daily transaction indicators
- Daily log with edit and delete controls
- PHP currency formatting by default
- Supabase persistence with row-level security

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

Transactions are stored in Supabase in `public.transactions`. Row-level security limits each authenticated user to their own rows.

The table and RLS setup SQL is checked in at `supabase/migrations/20260528000000_create_transactions.sql`. Apply that SQL to the `supabase-budget-tracker` project before using the app. Existing browser `localStorage` data from older versions is left untouched but is no longer used.

Users can create an account from the app with email/password. If email confirmation is enabled in Supabase Auth, new users will need to confirm their email before signing in.

## Currency

The app defaults to PHP. To change it later, set `VITE_BUDGET_CURRENCY` to another ISO currency code and rebuild the app.
