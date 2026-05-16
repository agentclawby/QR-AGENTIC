# EMERGN. — Demo Video

Remotion compositions for the EMERGN. demo and teaser. Brand-aligned
(zero rounded corners, void-black + pulse-cyan + signal-violet + ember-orange,
Space Grotesk / Inter / JetBrains Mono).

## Compositions

| ID | Length | Use |
|---|---|---|
| `Demo` | 60s @ 1080p / 30fps | Full feature walkthrough — boot → hero → 6-feature grid → forge flow → sentience radar → cortex feed → CTA |
| `Teaser` | 15s @ 1080p / 30fps | Punchy social ad — hook → 4 capability lines → CTA |

## Run

```bash
cd demo-video
npm install

# Live preview in the browser (recommended for iteration)
npm run dev

# Render finished MP4s into ./out
npm run build:teaser   # → out/emergn-teaser.mp4
npm run build:demo     # → out/emergn-demo.mp4
npm run build:all
```

Remotion downloads a headless Chromium on first render; expect 1–3 minutes for
the demo, ~30 seconds for the teaser, on an M-series Mac.

### Render tweaks

```bash
# Higher quality (slower, larger files)
npx remotion render Demo out/emergn-demo.mp4 --crf=18 --concurrency=4

# 4K (override Root.tsx WIDTH/HEIGHT to 3840×2160 first, then)
npx remotion render Demo out/emergn-demo-4k.mp4

# Vertical (TikTok / Reels): set WIDTH=1080 HEIGHT=1920 in Root.tsx
```

## File map

```
demo-video/
├── src/
│   ├── index.ts                  # registerRoot
│   ├── Root.tsx                  # Composition registry (Demo + Teaser)
│   ├── brand.ts                  # Colors + fonts (mirrors emergn/src/app/globals.css)
│   ├── compositions/
│   │   ├── Demo.tsx              # 60s scene timeline
│   │   └── Teaser.tsx            # 15s scene timeline
│   ├── components/
│   │   ├── AuroraBackdrop.tsx    # Breathing radial gradient
│   │   ├── ScanlineOverlay.tsx   # CRT scanlines + vignette
│   │   ├── BrandLogo.tsx         # EMERGN. wordmark with cyan period
│   │   ├── GlitchText.tsx        # RGB-split headline
│   │   └── Hairline.tsx          # Top/bottom edge accent
│   └── scenes/
│       ├── BootSequence.tsx      # Terminal boot → logo reveal
│       ├── HeroPitch.tsx         # "Your agent needs an identity"
│       ├── FeatureGrid.tsx       # 6 capability cards
│       ├── ForgeFlow.tsx         # Archetype picker + voice import progress
│       ├── SentienceRadar.tsx    # SVG radar + dimension bars
│       ├── CortexFeed.tsx        # Live decision stream
│       ├── CallToAction.tsx      # Logo + emergn.org CTA
│       ├── TeaserHook.tsx        # AGENTS. NOT TOOLS.
│       └── TeaserCapabilities.tsx # 4-line capability flash
├── remotion.config.ts
├── package.json
└── tsconfig.json
```

## Editing

Tune timings in `src/compositions/{Demo,Teaser}.tsx` — change a scene's
`durationInSeconds` and the timeline auto-recomputes. Tune brand tokens in
`src/brand.ts`. Each scene reads `useCurrentFrame()` so animations are pure
functions of time, no mutable state.

For voiceover/audio, drop a file in `public/` and add `<Audio src={…} />`
inside the relevant composition. Default render is silent.
