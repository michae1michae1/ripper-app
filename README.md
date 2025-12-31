# Ripper Limit - MTG Event Manager

A web application for running Magic: The Gathering draft and sealed events. Manage player registration, track draft picks with timers, run Swiss-style pairings, and generate final standings.

## Features

- **Event Setup**: Choose between Booster Draft or Sealed Deck formats
- **Draft Timer**: Track pack passes with visual pod seating and pass direction
- **Deckbuilding Timer**: Large countdown display with keyboard shortcuts
- **Swiss Pairing**: Automatic pairings with proper tiebreakers and bye handling
- **Live Standings**: Real-time rankings with OMW%, GW%, and exportable results
- **Shareable Links**: Generate short URLs for players to view standings

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Database**: Vercel KV (Redis)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment

This app is designed to be deployed on Vercel:

1. Push to GitHub
2. Connect the repo to Vercel
3. Add a Vercel KV store to your project
4. Deploy!

The Vercel KV environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) are automatically set when you link a KV store.

## Project Structure

```
src/
├── components/
│   ├── draft/      # Draft phase components
│   ├── event/      # Event setup components
│   ├── rounds/     # Match round components
│   ├── timer/      # Timer display components
│   └── ui/         # Shared UI components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and store
├── pages/          # Route pages
└── types/          # TypeScript types
api/
└── event/          # Vercel serverless functions
```

## License

MIT
