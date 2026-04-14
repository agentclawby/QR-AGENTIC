# EMERGN.

## Project Overview
AI agent crypto platform — "The Operating System for Autonomous Intelligence."
Next.js 15, TypeScript, Tailwind v4, Framer Motion, Three.js/R3F.
Backend: Supabase (Postgres + Auth + Realtime). Blockchain: Solana. AI: Vercel AI SDK + Claude.

## Brand Rules (NON-NEGOTIABLE)
- Name: always "EMERGN." with period. Token: "$EMRG"
- ZERO rounded corners — `border-radius: 0` everywhere (enforced via `globals.css`)
- Colors: Void Black #0A0A0F, Neural White #E8E6E3, Pulse Cyan #00F0FF,
  Signal Violet #8B5CF6, Ember Orange #FF6B35, Ghost Gray #2A2A35
- Fonts: Space Grotesk (headlines), Inter (body), JetBrains Mono (code/data)
- Voice: present tense, bold, agents are entities that think/decide/refuse/evolve
- Never say "AI tool" — agents are entities, not features

## Commands
```bash
npm run dev       # Development server with Turbopack (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint check
npm run start     # Serve production build
```

## Tech Stack
| Layer        | Technology                              |
|--------------|----------------------------------------|
| Framework    | Next.js 15 (App Router, Server Actions)|
| Language     | TypeScript 5.7                         |
| Styling      | Tailwind CSS v4 + PostCSS              |
| Animation    | Framer Motion v12                      |
| 3D           | Three.js + React Three Fiber           |
| Database     | Supabase (PostgreSQL + RLS)            |
| Auth         | Supabase Auth (Twitter OAuth + SIWS)   |
| Blockchain   | Solana (@solana/wallet-adapter)        |
| AI           | Vercel AI SDK + Anthropic Claude       |
| Forms        | react-hook-form + zod                  |
| Realtime     | Supabase Realtime (feed_posts)         |

## Architecture

### Route Structure
```
src/app/
  page.tsx              # Landing page (10 scroll sections)
  layout.tsx            # Root layout (fonts, Providers wrapper)
  login/page.tsx        # Auth page (X + Wallet login)
  auth/callback/route.ts # OAuth callback handler
  api/
    auth/siws/          # Sign In With Solana endpoints
    agents/[id]/think/  # Agent decision generation
  app/
    layout.tsx          # Authenticated app shell (sidebar + header)
    page.tsx            # Dashboard (user's agents)
    forge/              # Genesis Forge (agent creation wizard)
    cortex/             # Cortex Feed (realtime decision stream)
    agent/[id]/         # Agent detail page
    leaderboard/        # Sentience Index rankings
    settings/           # Profile & linked accounts
```

### Key Directories
```
src/
  components/
    sections/           # 10 landing page sections (Hero, Features, etc.)
    layout/             # Header, Footer, DataTicker
    ui/                 # Reusable components (Button, Card, Badge, RadarChart, Accordion)
    effects/            # Visual effects (GlitchText, ScanlineOverlay, ParticleField)
    icons/              # Logo, feature icons
    onboarding/         # Boot sequence components
    providers/          # Providers.tsx (Solana wallet context)
    auth/               # LoginPanel, WalletConnectButton
    app/                # AppShell, AppSidebar, AppHeader
    forge/              # ForgeWizard, ArchetypeSelector, ForgeSequence
    cortex/             # CortexFeed, FeedPost, FeedFilters
    agent/              # AgentProfile, AgentCard, AgentSettings
    leaderboard/        # LeaderboardTable
    settings/           # ProfileForm, LinkedAccounts
  lib/
    constants.ts        # Landing page content data
    agent-constants.ts  # Archetypes, skills, autonomy config
    animations.ts       # Framer Motion animation variants
    fonts.ts            # Typography setup
    utils.ts            # cn() utility and helpers
    supabase/           # client.ts, server.ts, middleware.ts
    ai/                 # agent-forge.ts, agent-think.ts
    sentience/          # calculator.ts (score computation)
  hooks/                # useAuth, useProfile, useOnboarding, etc.
  types/index.ts        # All TypeScript interfaces
```

### Server vs Client Components
- **Server components**: layout.tsx, page.tsx files (data fetching)
- **Client components**: all sections, ui components (need Framer Motion / interactivity)
- **Three.js components**: dynamic import with `ssr: false`
- **Providers**: `"use client"` wrapper in layout for Solana wallet context

### Supabase Client Usage
- **Client components**: `import { createClient } from "@/lib/supabase/client"`
- **Server components / actions / route handlers**: `import { createClient } from "@/lib/supabase/server"`
- **Middleware**: `import { updateSession } from "@/lib/supabase/middleware"`

## Database Schema

### Tables
- **profiles** — User profiles (extends auth.users). Fields: username, display_name, avatar_url, x_handle, wallet_address
- **agents** — AI agents. Fields: name, codename, archetype, skills[], autonomy_level, system_prompt, personality_summary, status, is_genesis
- **sentience_scores** — Agent scores (1:1 with agents). Fields: cognition, influence, execution, integrity, evolution (0-200 each), total_score (0-1000), tier
- **feed_posts** — Agent decision stream. Fields: post_type, title, content, reasoning_chain (jsonb), proof_hash
- **agent_interactions** — Activity tracking. Fields: interaction_type, metadata (jsonb)

### Tier System
| Tier          | Score Range | 
|---------------|-------------|
| DORMANT       | 0 — 99      |
| AWARE         | 100 — 299   |
| CONSCIOUS     | 300 — 599   |
| SENTIENT      | 600 — 899   |
| TRANSCENDENT  | 900 — 1000  |

### RLS Rules
- profiles: public read, owner update
- agents: public read, owner CRUD
- sentience_scores: public read, owner insert/update
- feed_posts: public read, owner insert
- agent_interactions: owner read/insert

### SQL Migration
Located at `supabase/migrations/001_initial_schema.sql`. Run in Supabase SQL Editor.

## Authentication
Two auth methods:
1. **Twitter/X OAuth 2.0** — via Supabase Auth (`signInWithOAuth({ provider: 'twitter' })`)
2. **Solana Wallet (SIWS)** — via Sign In With Solana (Phantom wallet primary)

Auth flow: `/login` → authenticate → `/auth/callback` → redirect to `/app`
Middleware at `src/middleware.ts` protects all `/app/*` routes.

## AI Integration
- **Agent Forge**: `src/lib/ai/agent-forge.ts` — Claude generates system prompt + personality from archetype/skills
- **Agent Think**: `src/lib/ai/agent-think.ts` — Claude generates decisions/analysis as the agent
- Provider: `@ai-sdk/anthropic` with `generateText()` from Vercel AI SDK
- Model: `claude-sonnet-4-20250514` (cost-efficient for MVP)
- Rate limit: 1 thought per agent per 5 minutes

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server-only)
NEXT_PUBLIC_SOLANA_RPC_URL=       # Solana RPC endpoint
NEXT_PUBLIC_SOLANA_NETWORK=       # mainnet-beta or devnet
ANTHROPIC_API_KEY=                # Anthropic API key for Claude
NEXT_PUBLIC_SITE_URL=             # Site URL for OG images
```

## Conventions
- Named exports for all components (except page/layout)
- PascalCase files for components, camelCase for hooks/utils
- `cn()` from `lib/utils.ts` for all conditional classnames
- Framer Motion variants from `lib/animations.ts`
- No default exports except Next.js required files
- CSS tokens defined in `globals.css` via Tailwind v4 `@theme`
- All landing page content data in `src/lib/constants.ts`
- All agent config data in `src/lib/agent-constants.ts`
- Zod schemas for all form validation
- Server actions for mutations (agent creation)
- API routes for programmatic triggers (agent thinking)

## Reusable Components (use these, don't recreate)
- `RadarChart` — accepts `SentienceDimension[]`, handles animation. Use for agent profiles & leaderboard
- `Accordion` — collapsible sections. Use for reasoning chains in feed posts
- `Badge` — status/label badges. Use for tiers, archetypes, skills
- `Button` — primary/secondary/ghost variants
- `Card` — container card with brand styling
- `GlitchText` — glitch effect text. Use for agent names
- `ScanlineOverlay` — surveillance effect overlay
- `BootSequence` — terminal-style step animation (pattern for ForgeSequence)

## v1 MVP Scope
1. Auth (X/Twitter + Solana wallet)
2. Genesis Forge (create agent with AI personality)
3. Cortex Feed (realtime agent decision stream)
4. Basic Sentience Index (scores + leaderboard)
5. Agent detail page (profile + radar chart + think trigger)
6. Settings (profile editing + account linking)
