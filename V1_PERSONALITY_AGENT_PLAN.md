# V1 Personality Agent Plan

## One-Line Product

Build a product where a user connects their X account, wallet, and optional knowledge sources, and the platform creates an AI agent that feels like their personality, acts within clear permission boundaries, and is useful from day one.

## Core V1 Thesis

The V1 should **not** try to fully "train a new model" per user.

The V1 should instead do four things well:

1. Extract the user's voice, tone, interests, and decision patterns from X.
2. Let the user add more context through documents, links, wallet history, and instructions.
3. Turn that profile into a useful agent that can help with content, research, monitoring, and community work.
4. Monetize through stable payments first, while keeping tokenization optional and delayed until usage is proven.

This is the fastest path to something that is both launchable and sticky.

## Product Positioning

This is not "an AI chatbot with a Twitter skin."

This is:

- a **personality engine**
- a **memory layer**
- an **action layer**
- a **distribution layer** through X
- an optional **onchain identity / monetization layer**

The emotional promise is:

> "Your agent sounds like you, knows what you care about, works for you, and can eventually become its own onchain entity."

## Best V1 Use Case

The best V1 is:

**"Connect X -> generate your personality agent -> train it with more context -> use it to post, reply, monitor, and research in your style."**

That is stronger than leading with "launch a token" because the token only matters if the agent is already useful.

## Recommended V1 User Flow

1. User signs up.
2. User connects X.
3. Platform pulls profile, recent posts, replies, engagement patterns, and top topics.
4. System generates:
   - personality profile
   - tone sliders
   - topic map
   - do / do-not-say rules
   - draft system prompt
5. User edits and confirms the agent profile.
6. User optionally connects:
   - wallet
   - website
   - docs / PDFs
   - bio / brand notes
   - watchlists
7. User picks an agent role:
   - Creator Agent
   - Research Agent
   - Community Agent
   - Trading / Signal Agent
8. Agent becomes usable inside a dashboard with approval controls.
9. User can publish an agent page and optionally mint an onchain identity object for that agent.

## What The Agent Should Actually Do In V1

The key rule is simple:

**Personality alone is novelty. Personality + repeated utility is a product.**

### V1 utility modules

1. **Content Copilot**
   - Draft posts in the user's tone
   - Rewrite rough ideas into polished posts
   - Generate thread ideas from recent trends
   - Turn links or notes into posts

2. **Reply Copilot**
   - Suggest replies to mentions or important posts
   - Rank reply opportunities by relevance
   - Keep a consistent voice
   - Require approval before posting in V1

3. **Social Monitor**
   - Track mentions, keywords, wallets, tokens, or competitors
   - Alert the user when something important happens
   - Generate "what matters now" summaries

4. **Research / Briefing Agent**
   - Produce daily or on-demand briefs
   - Summarize narratives around a token, project, or topic
   - Cross-reference social signals with user-defined watchlists

5. **Knowledge Agent**
   - Answer questions using uploaded docs, site links, and profile context
   - Help founders, creators, and traders stay on-brand

## Best V1 Personas To Target

Do not try to serve everyone first.

The strongest early users are:

1. **Crypto founders / anonymous builders**
   - Need constant posting, replying, monitoring, and narrative management

2. **Traders / researchers**
   - Need alerting, summaries, and public content in a recognizable style

3. **KOLs / creators**
   - Need content scale without losing voice

These users already live on X, care about identity, and understand wallets and onchain status.

## How "Training" Should Work In V1

Avoid expensive or slow fine-tuning workflows in V1.

Use a layered system instead:

1. **Style Extraction**
   - Analyze X posts for tone, vocabulary, sentence length, emotional profile, humor, conviction, and posting patterns.

2. **Belief / Topic Mapping**
   - Identify recurring themes, strong opinions, enemies, favorite topics, and content pillars.

3. **Memory Layer**
   - Store facts, preferences, past drafts, wallet labels, project notes, and user instructions.

4. **Skill Packs**
   - Add optional capabilities like research, posting, monitoring, or wallet-aware summaries.

5. **Human Corrections**
   - Every edit the user makes becomes signal for improving the agent.

This gives the feeling of "training" without the cost and complexity of actually retraining a model per user.

## Personality System Design

The agent personality should not just be a paragraph.

It should be structured as:

- identity summary
- tone profile
- value system
- risk tolerance
- posting rules
- banned phrases / forbidden positions
- favorite topics
- example posts
- reply style
- decision boundaries

The user should be able to edit these directly.

That is important because users will not fully trust an agent created from X data alone.

## Recommended V1 Onchain Strategy

### Best choice for V1

Use **wallet connection + optional onchain identity**, but **do not make the product depend on a custom token**.

### What to include

1. Wallet connect
2. Optional agent identity mint
3. Optional public ownership badge
4. Optional wallet-linked reputation / proof layer

### What to delay

1. Per-user agent token launches
2. Bonding curves
3. Revenue-share token promises
4. Governance tokens
5. Automatic agent trading with real funds

The reason is simple:

If the agent is not yet useful, the token becomes the product, and that usually creates the wrong incentives too early.

## Best Payment Strategy For V1

### Recommendation

Use:

1. **Card payments** for normal users
2. **USDC payments** for crypto-native users
3. **Internal usage credits** inside the app

### Why this is best

- Easier onboarding
- Cleaner pricing
- Less regulatory and liquidity complexity
- More predictable revenue
- Better for non-crypto users
- Still works for crypto-native users

### Suggested model

- Free tier: connect X, create one agent, limited drafts and summaries
- Pro tier: monthly subscription for more memory, more actions, more monitoring
- Credit top-ups: optional usage credits for heavy users
- Team tier later: shared agents, seats, approval workflows

## Token Recommendation

### What I recommend

**Do not launch the core V1 around your own token.**

Instead:

- make the product payable in fiat and USDC
- track points / reputation offchain first
- launch a platform token only after clear product usage and retention

### If you still want an onchain object in V1

The best V1 onchain primitive is:

- **Agent Passport NFT**
- or **Genesis Agent NFT**

That gives status and identity without forcing the whole business into token mechanics too early.

### When to consider a token later

Only after the product proves:

1. weekly active usage
2. paying retention
3. strong agent identity / reputation loops
4. clear token utility beyond speculation

## Public Agent Experience

Each agent should get a public page with:

- name
- avatar
- personality summary
- owner verification
- linked X profile
- skills
- recent posts or decisions
- memory / source badges
- reputation score
- payment / subscription state if relevant

This creates social proof and shareability.

## Recommended V1 Safety Model

Because the product touches X automation and potentially onchain actions, safety has to be part of the design.

### V1 defaults

1. Draft-first posting
2. Human approval required for replies
3. No autonomous DMs
4. No mass follow / unfollow features
5. No real-money autonomous trading in V1
6. Clear activity logs
7. Rate limits and duplicate-content checks
8. Clear disclosure that the user is responsible for agent actions

### Why this matters

This keeps the product aligned with platform rules and reduces the chance that users get banned or lose trust.

## Technical V1 Architecture

### Core systems

1. **Identity & Auth**
   - user account
   - X OAuth
   - wallet connect

2. **Ingestion Layer**
   - pull X posts / replies / profile data
   - ingest docs, URLs, wallet labels, notes

3. **Personality Engine**
   - style extraction
   - trait scoring
   - prompt builder
   - editable profile schema

4. **Memory Layer**
   - vector retrieval for uploaded knowledge
   - structured facts and user settings
   - action history

5. **Agent Runtime**
   - content generation
   - reply suggestions
   - monitoring jobs
   - summarization jobs

6. **Action Center**
   - approve / reject posts
   - edit drafts
   - schedule content
   - review alerts

7. **Billing Layer**
   - subscriptions
   - credits
   - USDC checkout

8. **Reputation Layer**
   - activity score
   - response quality
   - consistency score
   - trust / approval rate

## Data Model Additions To Prioritize

Beyond the current agent schema, add:

- `agent_personality_traits`
- `agent_sources`
- `agent_memory_entries`
- `agent_guardrails`
- `agent_watchlists`
- `agent_drafts`
- `agent_actions`
- `agent_usage_credits`
- `agent_public_profiles`

## V1 Dashboard Modules

1. Agent setup wizard
2. Personality editor
3. Training sources manager
4. Draft queue
5. Monitoring / alerts panel
6. Agent activity log
7. Billing and credits
8. Public profile settings

## What To Cut From V1

These ideas are interesting, but they should be pushed later:

1. Full token launch
2. User-specific agent token launches
3. Autonomous onchain trading with real capital
4. Agent-vs-agent arena
5. DAO governance
6. Cross-platform expansion beyond X
7. Agent merging / convergence
8. Invisible "specter mode"
9. Full social network before the core agent workflow works

If you try to ship these too early, V1 will become broad, expensive, and unfocused.

## 90-Day Execution Plan

### Phase 1: Foundation

**Weeks 1-2**

- finalize V1 scope
- implement X connect
- define personality schema
- define source ingestion formats
- define plans and pricing

### Phase 2: Personality Engine

**Weeks 3-4**

- ingest X history
- generate personality profile
- build editable personality UI
- generate first content drafts in the user's style

### Phase 3: Utility Layer

**Weeks 5-6**

- draft queue
- reply suggestions
- watchlists
- alert summaries
- source uploads

### Phase 4: Monetization + Public Identity

**Weeks 7-8**

- subscriptions
- USDC payments
- credits
- public agent pages
- optional agent identity mint

### Phase 5: Beta Launch

**Weeks 9-10**

- onboard early founders / traders / KOLs
- gather personality quality feedback
- tighten safety rules
- improve action logs and approvals

### Phase 6: Polish + Growth

**Weeks 11-12**

- improve onboarding
- add referral system
- improve retention loops
- ship shareable public pages
- prepare token strategy only if usage supports it

## Success Metrics For V1

Measure these first:

1. X connect completion rate
2. agent creation completion rate
3. percentage of users who upload extra sources
4. weekly active agents
5. drafts approved and published
6. reply suggestion acceptance rate
7. alert open rate
8. paid conversion
9. 30-day retention
10. number of users who say "this actually sounds like me"

That last one is important. If the personality quality is weak, the whole concept breaks.

## Strategic Recommendation

If I reduce everything to one decision:

**V1 should be a personality-based X agent platform with memory, approvals, monitoring, and stablecoin/card payments.**

Not:

- a token-first platform
- a full autonomous trading protocol
- a social network for agents before the agents are useful

## Best Final V1 Pitch

> Connect your X account and create an AI agent that thinks, writes, and works in your style.
> Train it with your posts, docs, links, and wallet context.
> Use it to draft content, monitor your world, reply smarter, and build a public onchain identity.
> Pay with card or USDC.
> Tokenization comes later, once the agent is valuable enough to deserve it.

## Sources Used For This Plan

- X Developer Policy on login and platform rules: https://developer.x.com/developer-terms/policy
- X account behavior best practices: https://help.x.com/articles/110878
- Solana payments documentation: https://solana.com/docs/payments
- Stripe stablecoin payouts documentation: https://docs.stripe.com/crypto/stablecoin-payouts
- Base account / one-tap USDC payment docs: https://docs.base.org/mini-apps/features/wallet

