# MindVault — Frontend

Next.js 15 application providing the adaptive tutor UI, privacy monitor,
and parent dashboard.

## Development

```bash
pnpm dev          # Next.js dev server on :3000
pnpm build        # production build
pnpm start        # serve production build
pnpm typecheck    # type-check without emitting
```

## Structure

```
app/            Next.js App Router pages
components/     React components (tutor, privacy-panel, dashboard)
lib/            Utilities, API client, stores, hooks
styles/         Global CSS + Tailwind
```

## Environment

Copy `.env.example` → `.env.local` and fill in values.
