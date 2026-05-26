# Budget Tracker

A simple personal budget tracker built with Vite, React, TypeScript, Tailwind CSS, and browser storage. It is designed to deploy as a static site on the Vercel Hobby/free plan.

## Features

- Password gate using `ADMIN_PASSWORD`
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
- Browser `localStorage` persistence

## Important Security Note

This app is client-only. `ADMIN_PASSWORD` is used by the frontend bundle, which means it is convenience-level protection, not secure server-side authentication. Use it for personal tracking, not for sensitive shared access.

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

Set your password:

```env
ADMIN_PASSWORD=your-password-here
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

This app deploys as a static Vite site. No server functions, database, or filesystem writes are required.

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Use the Vite framework preset.
4. Add this environment variable in Vercel Project Settings:

```env
ADMIN_PASSWORD=your-password-here
```

5. Deploy.

The included `vercel.json` sets:

- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`

## Data Storage

Transactions are stored in the current browser under the `budget-tracker-transactions` localStorage key. Data will not automatically sync across browsers, devices, or private browsing sessions.

## Currency

The app defaults to PHP. To change it later, set `VITE_BUDGET_CURRENCY` to another ISO currency code and rebuild the app.
