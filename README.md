# Don't Go Broke in London

**A statement parser for making London spending easier to inspect.**

London is brilliant, chaotic, and brutally expensive. Don't Go Broke in London helps people turn messy bank statements into a clear transaction table with dates, descriptions, signed amounts, balances, and supporting details.

<div align="center">
  <img
    src="assets/app.png"
    alt="Don't Go Broke in London homepage"
    width="900"
  />
</div>

## The Pitch

Most budgeting apps ask users to manually categorise spending before they can even see the data clearly. This version focuses on the foundation: upload statement PDFs, extract the transactions, and review them in a clean table.

The hackathon vision is simple: **start with reliable transaction extraction, then build smarter money tools on top.**

## What It Does

- Upload one or more PDF bank statements.
- Add personal context by typing or recording a short voice note.
- Transcribe voice notes with OpenAI's `gpt-4o-transcribe`.
- Parse Revolut statement PDFs into structured transactions.
- Store each statement upload, uploaded file, transaction, balance, and user context.
- Route users into a transaction table after import.

## Demo Flow

1. Open the landing page and start a new statement import.
2. Add context like salary, rent, subscriptions, savings goals, debts, commute costs, or spending worries.
3. Upload Revolut PDF statements.
4. Submit the statements.
5. The app validates the files, extracts transactions, saves them, and opens a transaction table.

## Why It Matters

Londoners are squeezed by rent, transport, food, subscriptions, social spending, debt, and unpredictable monthly costs. Generic budgeting advice misses that context. This app is designed around local financial reality: practical, plain-English guidance for people trying to stay afloat without becoming spreadsheet experts.

## Built So Far

- Polished responsive landing page and upload UI.
- Drag-and-drop PDF upload with validation and file size limits.
- Browser microphone recording for optional spoken context.
- API route for audio transcription.
- API route for PDF validation, parsing, and persistence.
- Revolut statement parser for transaction dates, descriptions, signed amounts, balances, and details.
- Local SQLite database in development and Turso/libSQL support in production.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **APIs:** Next.js route handlers
- **AI:** OpenAI audio transcription, Claude SDK prepared for recommendation generation
- **Parsing:** `pdf-parse`
- **Database:** SQLite locally with `better-sqlite3`, Turso/libSQL in production
- **Package manager:** pnpm

## Architecture

```text
User context + PDF statements
        |
        v
Upload UI
        |
        +--> /api/transcribe -> OpenAI transcription
        |
        +--> /api/upload -> PDF validation -> Revolut parser -> database
                                      |
                                      v
                            Transaction table
```

## Getting Started

**Prerequisites:** Node.js 20+ and pnpm.

Install dependencies:

```bash
pnpm install
```

Create `.env.local`:

```env
DATABASE_URL=file:./data/financial.db
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## What's Next

- Add spending categories, recurring cost detection, and monthly burn insights.
- Add filters, search, and sorting to the transaction table.
- Generate insights from the cleaned transaction data later.
