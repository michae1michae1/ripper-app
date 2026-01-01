# Ripper Limit - MTG Event Manager

A web application for running Magic: The Gathering draft and sealed events. Manage player registration, track draft picks with timers, run Swiss-style pairings, and generate final standings.

## Features

### Event Management
- **Event Setup**: Choose between Booster Draft or Sealed Deck formats
- **Player Registration**: Add players with auto-generated avatars and mana color assignments
- **Admin Authentication**: PIN-protected admin controls with session persistence

### Draft Phase
- **Pack Timer**: Configurable countdown timer for pick passes
- **Pod Seating**: Visual pod arrangement showing all players
- **Pass Direction**: Automatic left/right alternation between packs
- **Event Logging**: Detailed log with timestamps, pack durations, and timer events

### Deckbuilding Phase
- **Large Timer Display**: Full-screen countdown with clear visibility
- **Keyboard Shortcuts**: Quick controls for timer management

### Swiss Rounds
- **Automatic Pairings**: Swiss-style matchmaking with proper tiebreakers
- **Score Entry**: Easy +/- controls with 3-0, 2-1, 1-1 draw support
- **Live Updates**: Player records update in real-time as scores are entered
- **Round Timer**: Integrated timer matching per-round time limits
- **Bye Handling**: Automatic bye assignment for odd player counts

### Final Results
- **Live Standings**: Real-time rankings with points, OMW%, GW%, OGW%
- **Mana Symbols**: Scryfall-powered mana icons for player colors
- **Shareable Links**: Generate short URLs for players to view standings
- **Export Options**: Copy standings for external use

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 4
- **State**: Zustand (with persistence)
- **Database**: Vercel KV (Redis)
- **Hosting**: Vercel
- **Icons**: Lucide React
- **MTG Assets**: Scryfall API

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

### Environment Variables

For local development with Vercel KV:
```env
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

### Deployment

This app is designed to be deployed on Vercel:

1. Push to GitHub
2. Connect the repo to Vercel
3. Add a Vercel KV store to your project
4. Deploy!

The Vercel KV environment variables are automatically set when you link a KV store.

## Project Structure

```
src/
├── components/
│   ├── draft/          # Draft phase (PackIndicator, PodSeating, PassDirection)
│   ├── event/          # Event setup (PlayerInput, PlayerList, SetSelector)
│   ├── rounds/         # Match rounds (MatchCard, StandingsModal)
│   ├── timer/          # Timer display (TimerDisplay, TimerControls)
│   └── ui/             # Shared UI (Button, Badge, Card, Input, Avatar)
├── hooks/
│   └── useTimer.ts     # Timer state management hook
├── lib/
│   ├── api.ts          # Vercel KV API client
│   ├── cn.ts           # Class name utility (clsx + tailwind-merge)
│   ├── constants.ts    # App constants (mana colors, timer durations)
│   ├── generateId.ts   # ID generation utilities
│   ├── scryfall.ts     # Scryfall API integration
│   ├── store.ts        # Zustand store with all app state
│   └── swiss.ts        # Swiss pairing algorithm
├── pages/
│   ├── HomePage.tsx           # Landing page
│   ├── AdminNewEventPage.tsx  # Create new event
│   ├── EventSetupPage.tsx     # Configure event settings
│   ├── DraftPhasePage.tsx     # Draft with timer & pod
│   ├── DeckbuildingPage.tsx   # Deckbuilding timer
│   ├── MatchRoundsPage.tsx    # Swiss round matches
│   └── FinalScoreboardPage.tsx # Final standings
└── types/
    └── event.ts        # TypeScript type definitions
api/
├── event/
│   ├── index.ts        # Create event endpoint
│   ├── [id].ts         # Get/update event by ID
│   └── code/[code].ts  # Get event by short code
└── verify-password.ts  # Admin PIN verification
```

## Code Conventions

### CSS & Class Names

This project uses a hybrid approach with semantic BEM-style classes for structure combined with Tailwind utilities for styling:

```tsx
// Pages have data-page attribute
<div data-page="DraftPhasePage" className="draft-page min-h-screen">

// Components have data-component attribute
<div data-component="MatchCard" className="match-card bg-obsidian">

// BEM naming: block__element--modifier
<div className="match-card__score-display--winner">
```

See `.cursor/rules/css-classname-conventions.mdc` for complete guidelines.

### Component Patterns

- Props interface required for every component
- Components max 100 lines
- Business logic in hooks/utils, not in JSX
- One component per file

See `.cursor/rules/react-composition-focus.mdc` for complete guidelines.

## Color Palette

The app uses a custom MTG-inspired color palette:

| Token | Color | Usage |
|-------|-------|-------|
| `midnight` | #0a0a0f | Primary background |
| `obsidian` | #12121a | Card backgrounds |
| `slate` | #1e1e2e | Elevated surfaces |
| `storm` | #2d2d3d | Borders |
| `mist` | #6b7280 | Muted text |
| `snow` | #f8fafc | Primary text |
| `arcane` | #8b5cf6 | Primary accent (purple) |
| `success` | #22c55e | Success states |
| `warning` | #eab308 | Warning states |
| `error` | #ef4444 | Error states |

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Type-check and build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## License

MIT
