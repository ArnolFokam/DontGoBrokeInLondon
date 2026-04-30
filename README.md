# Don't Go Broke in London

**An AI financial audit companion for surviving one of the world's most expensive cities.**

London is brilliant, chaotic, and brutally expensive. Don't Go Broke in London helps people turn messy bank statements and personal money worries into a practical audit of where their money is going, what is hurting most, and what to do next.

<div align="center">
  <img
    src="assets/app.png"
    alt="Don't Go Broke in London homepage"
    width="900"
  />
</div>

## The Pitch

Most budgeting apps ask users to manually categorise spending, stare at charts, and figure out the hard part themselves. We built a faster flow for real life: upload your statements, add voice or text context about rent, salary, debts, bills, goals, and London-specific pressure points, then let the audit workspace prepare the data for personalised financial advice.

The hackathon vision is simple: **a money agent that understands both your transactions and the city you live in.**

## What It Does

- Upload one or more PDF bank statements.
- Add personal context by typing or recording a short voice note.
- Transcribe voice notes with OpenAI's `gpt-4o-transcribe`.
- Parse Revolut statement PDFs into structured transactions.
- Store each audit session, uploaded file, transaction, balance, and user context.
- Route users into an audit workspace where recommendations can be generated next.

## Demo Flow

1. Open the landing page and start a new financial audit.
2. Add context like salary, rent, subscriptions, savings goals, debts, commute costs, or spending worries.
3. Upload Revolut PDF statements.
4. Submit the audit.
5. The app validates the files, extracts transactions, saves the audit, and opens a dedicated audit workspace.

## Why It Matters

Londoners are squeezed by rent, transport, food, subscriptions, social spending, debt, and unpredictable monthly costs. Generic budgeting advice misses that context. This app is designed around local financial reality: practical, plain-English guidance for people trying to stay afloat without becoming spreadsheet experts.

## Built So Far

- Polished responsive landing page and audit intake UI.
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
Audit intake UI
        |
        +--> /api/transcribe -> OpenAI transcription
        |
        +--> /api/upload -> PDF validation -> Revolut parser -> database
                                      |
                                      v
                               Audit workspace
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

- Generate the final AI audit with personalised London-specific recommendations.
- Add spending categories, recurring cost detection, and monthly burn insights.
- Show savings opportunities across rent, transport, food, subscriptions, debt, and goals.
- Export an action plan users can actually follow after the hackathon demo.
