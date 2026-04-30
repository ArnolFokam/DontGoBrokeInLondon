# DontGoBrokeInLondon

London is expensive. This tool helps you stay on top of it.

## What it does

What if an agent could audit your finances and give you financially savvy tips to thrive in one of the most expensive cities in the world? Drop in your bank statements and let Claude do the hard work — analysing your spending, spotting patterns, and handing you actionable advice built for London life.

## Features

- Dark-mode UI built with Next.js and Tailwind CSS
- Dual-environment database: SQLite (local dev) and Turso (production)
- PDF text extraction via `pdf-parse`
- Claude integration via `@anthropic-ai/sdk` (coming in checkpoint 1)

## Installation

**Prerequisites:** Node.js 20+, pnpm

```bash
pnpm install
```

Copy the environment file and fill in your keys:

```bash
cp .env.local.example .env.local
```

```env
DATABASE_URL=file:./data/financial.db
ANTHROPIC_API_KEY=your_key_here
```

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
