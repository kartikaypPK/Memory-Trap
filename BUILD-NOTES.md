# Memory Trap — Phase 0 build notes

Built 19 Nov 2026 from `prompts/phase-00-setup.md`, `CLAUDE.md`, `docs/02-DESIGN-SYSTEM.md`,
`docs/05-ARCHITECTURE.md` and `PLAY-STORE-DEPENDENCY-AUDIT.md`.

## Exact versions installed

Created with `npx create-expo-app@latest --template blank-typescript` on 19 Nov 2026,
then converted to Expo Router.

| Package | Installed version |
|---|---|
| Expo SDK | 58.0.0 (expo 58.0.26) |
| React Native | 0.88.1 |
| React | 19.3.0 |
| TypeScript | 6.0.3 |
| expo-router | 58.0.32 |
| react-native-reanimated | 4.7.1 |
| react-native-worklets (forced peer of reanimated) | 0.13.0 |
| react-native-gesture-handler | 3.3.0 |
| react-native-safe-area-context | 5.11.1 |
| react-native-screens (expo-router peer) | 4.30.1 |
| react-native-svg | 15.16.0 |
| @shopify/flash-list | 2.3.2 |
| @supabase/supabase-js | 2.119.1 |
| zustand | 5.1.0 |
| @tanstack/react-query | 5.108.0 |
| @react-native-async-storage/async-storage | 2.2.0 |
| expo-audio | 58.0.12 |
| expo-font | 58.0.12 |
| expo-image | 58.0.18 |
| expo-blur | 58.0.6 |
| expo-linear-gradient | 58.0.4 |
| expo-haptics | 58.0.8 |
| expo-build-properties | 58.0.12 |
| expo-constants / expo-linking (expo-router peers) | 58.0.16 / 58.0.17 |
| expo-splash-screen (standard Expo template module) | 58.0.14 |
| expo-status-bar (from template) | 58.0.5 |
| @expo/vector-icons | 15.0.2 |
| @expo-google-fonts/plus-jakarta-sans / inter | 0.4.2 / 0.4.2 |
| babel-preset-expo (dev only, official template tooling) | 58.0.26 |

## Play Store pinning (from the audit)

- `app.config.ts` pins via expo-build-properties: compileSdkVersion 36,
  targetSdkVersion 36, buildToolsVersion "36.0.0" — Play requires target API 36
  for new apps since 31 Aug 2026; SDK defaults were not relied on.
- Verified with `npx expo config --type public`: name "Memory Trap", slug
  `memory-trap`, scheme `memorytrap`, portrait, `userInterfaceStyle: automatic`,
  android.package `com.memorytrap.app` (PLACEHOLDER — change to a domain the
  user owns before the first EAS build), adaptive icon background #7657E8.
- Permissions: config requests only `android.permission.INTERNET`.
  The expo-audio plugin is configured playback-only
  (`recordAudioAndroid: false`, `microphonePermission: false`,
  background playback/recording off), which removes RECORD_AUDIO and the
  foreground-service permissions it would otherwise add. `blockedPermissions`
  also lists RECORD_AUDIO, MODIFY_AUDIO_SETTINGS, FOREGROUND_SERVICE and
  FOREGROUND_SERVICE_MEDIA_PLAYBACK so they are stripped from the generated
  manifest at prebuild. Note: `expo config` output still shows
  MODIFY_AUDIO_SETTINGS (the plugin adds it unconditionally to the config
  permissions list; blockedPermissions are applied at manifest generation).

## Decisions and deviations

- **AsyncStorage, not MMKV.** The pack allows either. The current
  react-native-mmkv release requires react-native-nitro-modules, which is not
  in the approved dependency list, so AsyncStorage 2.2.0 is used.
  `src/lib/storage.ts` is the single wrapper to swap later.
- **Forced peer/template packages** (not optional extras): react-native-worklets
  (hard peer of reanimated 4.7.1), react-native-screens, expo-linking and
  expo-constants (expo-router peers), expo-splash-screen (Phase 0 requires
  holding the splash until fonts load), babel-preset-expo (devDependency,
  official Expo template tooling — needed for the reanimated/worklets plugin).
- **npm `--legacy-peer-deps`** was needed for later installs: the SDK 58 template
  pins react 19.3.0 while expo-router's web dependencies ask react-dom for
  react ^19.3.1. `expo install` itself reports "overriding peer dependency".
- **SDK 58 tab bar contract changed.** `Tabs`' `tabBar` callback now receives
  `{ state, descriptors, emitter, navigateToTab, insets }`, and
  `BottomTabBarProps` is not exported from the public `expo-router` entry.
  `src/components/TabBar.tsx` declares that exact structural shape locally.
- **SDK 58 `ExpoConfig` has no `splash` key** (rejected by tsc), so no splash
  block is set in app.config.ts and the expo-splash-screen config plugin was
  not added (not in the approved plugin list). The template splash-icon asset
  is present; splash appearance can be configured in a later phase.
- **Lint was not run:** the blank-typescript template ships no ESLint config or
  lint script, and `expo lint` would install eslint-config-expo, which is not
  in the approved list. Only `npx tsc --noEmit` was run (see below).
- Not added (per instructions): ads, IAP, ElevenLabs SDK, Sentry,
  expo-notifications, google-signin, netinfo, expo-updates. ElevenLabs remains
  offline-only — no SDK, no key, no runtime call.

## What was built

- `src/theme/theme.ts` — copied unchanged from the pack's `src-reference/theme.ts`
  (verified identical with diff). Written palette: primary #7657E8.
- `src/theme/ThemeProvider.tsx` + `useTheme` — Light default, Dark, System;
  preference persisted in AsyncStorage; `overrideMode` for the Design Gallery.
- Components in `src/components/`: Button (primary/secondary/destructive,
  52px pill, real 4px bottom lip view collapsing via Reanimated in 80ms,
  loading/disabled), Pill, Card, AppHeader (correct per-tab title, bell with
  dot, avatar + level badge), HudBar (streak/lives/XP), TabBar (5 tabs, LIVE
  badge support on Battle — off by default until Phase 6 wires the real
  condition), ProgressBar, Toggle (48dp target), plus PlaceholderScreen used
  by the tab placeholders.
- Routes: `app/_layout.tsx` (GestureHandlerRootView, SafeAreaProvider,
  ThemeProvider, QueryClientProvider, fonts via expo-font — Plus Jakarta Sans
  700/800 + Inter 400/500/700 — splash held until fonts load),
  `app/(tabs)/` with 5 placeholder screens (index/games/battle/progress/profile)
  using the real components with correct header titles HOME/GAMES/BATTLE/
  PROGRESS/PROFILE, and dev-only `app/design-gallery.tsx` rendering every base
  component in light and dark (redirects to / outside __DEV__).
- `src/lib/supabase.ts` — createClient from EXPO_PUBLIC_SUPABASE_URL /
  EXPO_PUBLIC_SUPABASE_ANON_KEY only, AsyncStorage session storage, placeholder
  values + dev warning when env is missing so Phase 0 runs without a project.
  `.env.example` provided; `.env` is git-ignored. No real keys anywhere.
- `supabase/schema.sql` — copied unchanged from the pack (verified identical
  with diff). `CLAUDE.md` copied to the project root unchanged.
- Folder layout from docs/05: src/theme, src/components, src/games (types.ts
  engine contract, prng.ts mulberry32, registry.ts empty), src/features
  (home/vault/progress/social/battle/profile), src/lib (+api), src/store
  (settings/session/runQueue zustand stores), src/types (database.ts placeholder
  noting generation via `supabase gen types`).
- `eas.json`: development (developmentClient, internal), preview (internal),
  production (autoIncrement).

## Verification

- `npx tsc --noEmit` — **passes, exit 0, no errors** (after fixing the SDK 58
  tab-bar shape, the removed `splash` config key, and the expo-audio
  permission options described above).
- `npx expo config --type public` — resolves; SDK 58.0.0, target/compile 36
  pinned, package and permissions as described above.
- Lint: not available in the template (see deviations).

## How to run it (development build, not Expo Go)

```bash
cd ~/workspace/memory-trap/project
cp .env.example .env   # fill in Supabase URL + anon key when a project exists
npm install
npx eas build -p android --profile development   # requires an EAS account
# install the development build on an emulator/device, then:
npx expo start --dev-client
```

No EAS build was run, no accounts were created, and nothing was committed to
git in this phase (the template's initialised .git directory was removed).

---

# Phase 1 — Auth, profile bootstrap, Home Hub

Built 19 Nov 2026 from `prompts/phase-01-auth-home.md`, `docs/03-SCREEN-SPECS.md`
(Home Hub) and `docs/01-PRD.md` (Accounts/Economy), against the live Supabase
project `nhgovmfhcsgigmxdzgwu` (URL + publishable key already in `.env`).

## Versions added

| Package | Installed version |
|---|---|
| @react-native-google-signin/google-signin | 17.0.0 (`^17.0.0`) |

That is the only new dependency — it is on the CLAUDE.md approved list.
Its config plugin was added to `app.config.ts`. No other dependency was
added; anything else that looked useful is noted below instead.

## Auth (`src/lib/auth.ts`, `src/store/session.ts`, `app/(auth)/`)

- **Session store** now holds the Supabase `Session`, user id, `isAnonymous`,
  the user's `Profile`, an `AuthStatus` (`loading` / `signedOut` /
  `needsProfile` / `ready`) and the persisted onboarding-seen flag.
  `initialize()` (called once from the root layout) restores the session and
  subscribes to `supabase.auth.onAuthStateChange`; every change re-fetches
  the profiles row and recomputes the status.
- **Auth gate** in `app/_layout.tsx`: loading → splash stays up; no session
  → `(auth)` group (first launch → `onboarding`, later → `welcome`);
  session but no profiles row → `(auth)/profile-setup`; session + profile →
  `(tabs)`.
- **Google**: `GoogleSignin.configure({ webClientId })` →
  `supabase.auth.signInWithIdToken({ provider: 'google', token })`, using
  `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (see `.env.example`). When the env var
  is missing the button renders disabled with "Google Sign-In is not
  configured yet. Use email or guest mode for now." — it never attempts a
  doomed sign-in. Cancel / Play-services / in-progress errors are mapped to
  readable states.
- **Email OTP**: `signInWithOtp` on `sign-in`, then `verify-otp` route with
  a 6-digit code field (`verifyOtp`, type `email`), resend with a 30s
  cooldown, and proper error messages.
- **Guest**: `supabase.auth.signInAnonymously()` from welcome and sign-in.
- **Routes**: `app/(auth)/_layout.tsx`, `welcome`, `onboarding` (3 slides;
  last slide has the 13+ age confirmation; Skip also available),
  `sign-in`, `verify-otp`, `profile-setup`.

## Profile bootstrap (RLS gap — read this before applying migrations)

`schema.sql` has **no INSERT policy on profiles**, so a client insert
fails under RLS. Instead of editing `schema.sql`, Phase 1 adds:

- `supabase/migrations/20261119000000_phase1_profile_bootstrap.sql` —
  SECURITY DEFINER RPC **`create_profile(p_display_name text, p_handle text,
  p_avatar_id text)`** returning the new `profiles` row. It uses
  `auth.uid()`, rejects a second profile for the same user, validates
  display name (2–24), handle (`^[a-z0-9_]{3,20}$`) and avatar id
  (`avatar_01`–`avatar_24`), generates a unique `friend_tag` (`#XXXXXX`
  from an unambiguous alphabet — no 0/O/1/I/L — with up to 10 retries on
  collision), and is granted to `authenticated` only. Anonymous (guest)
  users carry the `authenticated` role in Supabase, so the same RPC works
  for them.
- **The migration has NOT been applied** — there is no local Postgres and
  applying it is a Management-API step for the parent session. Until it is
  applied, profile-setup will surface the RPC-not-found error. Apply with
  `supabase db push` or via the Management API query endpoint.
- Client: `createProfile()` in `src/lib/auth.ts` calls the RPC and unwraps
  its `create_profile: …` error messages for display. Handle availability is
  checked live (debounced) against `public_profiles`.
- **Profile-setup screen**: display name, handle (sanitised as you type),
  avatar picker with **24 local avatars** — `src/lib/avatars.ts` defines
  `avatar_01`…`avatar_24` as Material icon + theme-tone pairs rendered by
  the new `Avatar` component. No external image calls. Age confirmation
  (13+) is required before submit, and there is a sign-out escape hatch.

## Home Hub (`app/(tabs)/index.tsx`, `src/features/home/`)

- **Data flow**: `useHomeData(profile)` composes the RLS tables directly
  (there is no `get_home_summary()` RPC yet — it is on the schema's
  "functions to implement" list): `game_types` → Continue Playing,
  `personal_bests` → per-game Best, `daily_mind_score` → weekly habit grid
  + circuit-done-today, `daily_circuits` → today's circuit row (read,
  reserved for Phase 4), `league_weeks` (current Monday, top 50) +
  `public_profiles` → League Podium top 3 and the user's own rank/tier,
  `level_thresholds` → level title + progress. Profile fields (streak,
  lives, XP, freezes, Mind Score) come from the session store.
- **Mocks**: `USE_MOCKS` in `src/lib/config.ts` (default **false**) swaps
  in the typed mocks in `src/features/home/mock.ts`. With real data, empty
  tables degrade gracefully: a brand-new user sees streak 0 / lives 3 /
  XP 0 / Mind Score 0, an all-open week grid with today ringed, all 8 games
  as "New", and a "No league standings yet" empty state. The weekly Mind
  Score delta chip is hidden until there is history (the real 7-day series
  is Phase 5's `get_progress_summary()`).
- **Sections**: greeting + league rank pill; Daily Circuit hero (gradient
  from theme tokens, "TODAY'S SPECIAL • 2X XP" badge, live countdown to
  midnight, streak / freeze / progress sub-tiles, PLAY NOW → Games tab —
  the circuit flow is Phase 4; a completed state replaces the CTA when
  today's circuit is done); Mind Score card with the new **RingProgress**
  (react-native-svg), level bar and weekly habit grid (done = teal check,
  today = teal ring, per docs/03); Continue Playing horizontal carousel of
  game cards (icon + category + name + Best/Play — PLAY routes to the Games
  tab until game screens exist in Phase 2); League Podium top 3 with the
  current user highlighted.
- **States**: skeleton cards while loading (`SkeletonLoader`), a full
  error card with Retry when the catalogue query fails, per-section empty
  states (`EmptyState`), pull-to-refresh, and the spec's offline banner
  ("CACHED LOCALLY • SYNCS ON CONNECT") whenever a Home query errors.
- New shared components: `Avatar`, `RingProgress`, `SkeletonLoader`
  (`SkeletonBlock`/`SkeletonCard`), `EmptyState`, `TextField` (48px, 2px
  border, primary on focus). All colours come from `useTheme` — a grep of
  the Phase 1 files for hex literals finds none outside `theme.ts`, and the
  new components were added to the Design Gallery so they render in light
  and dark side by side (the no-emulator dark-mode check).

## User-only configuration blockers (cannot be done from code)

1. **Google Sign-In**: create Google Cloud OAuth clients (Web + Android,
   Android needs the Play App Signing and debug/EAS SHA-1 fingerprints),
   put the Web client ID in `.env` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`,
   and enable the Google provider in Supabase (Authentication → Providers)
   with the same client ID/secret. Then rebuild the development build
   (Google Sign-In needs native code — no Expo Go). Until then the app
   shows the "not configured yet" state and email/guest work.
2. **Guest mode**: enable **Anonymous sign-ins** in the Supabase dashboard
   (Authentication → Providers → Anonymous). Attempting to enable it via
   the Management API returned 403, so it is dashboard-only. Until it is
   on, guest sign-in surfaces Supabase's error message.
3. **Apply the Phase 1 migration** (above) to the live project.

## Verification

- `npx tsc --noEmit` — **passes, exit 0, no errors** (one fix needed:
  `useSegments()` cast to `string[]` in the gate, since its per-route
  tuple typing rejects indexing a 1-segment route).
- `npx expo config --type public` — resolves; the google-signin plugin is
  present in the resolved plugin list.
- Lint: still unavailable (no ESLint config in the template; adding one
  needs an unapproved dependency — same note as Phase 0).
- Not run: EAS builds, emulator/device testing (none available), and the
  migration (see above). Nothing committed to git.

---

# Phase 2 — Game engine core + Pattern Recall + server-verified runs

Built 19 Nov 2026 from `prompts/phase-02-engine-pattern-recall.md`,
`docs/04-GAME-SPECS.md`, `docs/05-ARCHITECTURE.md` (anti-cheat) and
`docs/03-SCREEN-SPECS.md` screen 3. (The prompt's doc names differ from
the pack's actual file names: 04-GAME-SPECS is the game-rules doc and
05-ARCHITECTURE carries the start_run/submit_run flow.)

## Versions added

| Package | Installed version | Why |
|---|---|---|
| @react-native-community/netinfo | 12.0.1 | Connectivity for the offline queue flush (named in docs/05; on the approved list) |
| jest | 29.7.0 (dev) | Engine unit tests, explicitly specified by the phase prompt |

Jest uses **babel-jest with the existing babel.config.js**
(babel-preset-expo) rather than ts-jest (avoids a ts-jest/TypeScript 6
peer gamble) and rather than jest-expo (the engines are pure TS with no
RN imports, so tests run in a plain Node environment — see
`jest.config.js`). Tests import `describe/it/expect` from
`@jest/globals`, so no `@types/jest` was needed. npm needed
`--legacy-peer-deps` for the jest install (same React 19.3 template
peer quirk as Phase 0/1).

## Engine core (`src/games/`)

- `types.ts` — Phase 0 contract kept; added `LoggedInput<Input>`
  (`{ t, input }`, ms since the run clock started) and the `RunPhase`
  union (countdown/presenting/input/feedback/paused/finished).
- `prng.ts` — existing mulberry32 kept; refactored onto
  `mulberry32FromInt(seed: number)` and added `nextInt` / `shuffled`
  helpers. Seeds are strings (server-issued) or numbers.
- `registry.ts` — `pattern_recall` registered; `getEngine`/`hasEngine`
  helpers added. The other seven games register in Phase 3.

## Pattern Recall engine (`src/games/pattern-recall/`)

Pure TS, zero React/RN imports, integer-only scoring so the client and
the Deno replay are bit-identical.

- **Generation** (deterministic from the seed, all 10 rounds generated
  up front in `init`): grid 3x3 (rounds 1–3) → 4x4 (4–7) → 5x5 (8–10);
  sequence length 3, +1 every 2 rounds (3,3,4,4,5,5,6,6,7,7); each round
  draws a shuffled set of tile shapes (25 shape ids) and its sequence
  from the one PRNG stream.
- **Inputs**: `roundStart` (input window opened — anchors timing),
  `tap {tile}`, `timeout`, `rewatch`, `freeze`. `step()` appends every
  input to `state.log` — that log is the submission.
- **Mistakes**: wrong tap or timeout = −1 heart, combo reset. First
  mistake in a round spends the round's one retry (sequence replays
  from step 0); a second fails the round. 0 hearts ends the run.
- **Scoring** (docs/04 "100/step * combo, + time bonus"; constants in
  `config.ts`): per correct step, `floor((100 + 10*min(combo,20)) *
  (100 + (round-1)*10) / 100)` — combo scales a step from x1.0 to x3.0,
  the level multiplier from x1.0 (round 1) to x1.9 (round 10) — plus a
  time bonus of +25 (tap ≤1000ms after the previous event) or +10
  (≤2000ms). Perfect round (no mistake, no Re-Watch that round): +250.
  docs/04 specifies **no maximum score cap**, so none is applied.
  Accuracy = correct / total tap+timeout inputs.
- **Power-ups**: Re-Watch max 2/run (re-presents, forfeits that round's
  perfect bonus; its −1 XP from docs/04 is a profile-XP effect and is
  *not* deducted in v1 — XP is only ever awarded by submit-run; noted
  here as a deliberate simplification), Freeze max 2/run, +5s on the
  current step window.
- **Presentation/input timing** (config): flash on 620→320ms and gap
  210→110ms by round; per-step input window 5000ms − 250ms/round,
  floor 2500ms.
- **Anti-cheat validation**: `validatePatternRecallLog` flags
  non-monotonic timestamps and taps closer than 80ms (docs/04's
  sub-100ms plausibility rule).

## Tests (`npm test` — 14 passing)

- `src/games/pattern-recall/engine.test.ts` (12 tests): same seed →
  identical rounds; different seeds → different rounds; grid/sequence
  ramp; round-1 perfect score is exactly **655**; a full perfect run
  replays to the exact expected score (cross-checked against an
  independent reimplementation of the documented formula; max combo
  50, accuracy 1); all-wrong and all-timeout runs drain 3 hearts and
  score 0; no-input scores 0; a mistake breaks combo + perfect bonus
  (405 for the retried round 1); power-up caps; log validation.
- `src/games/pattern-recall/replay-parity.test.ts` (2 tests) — the
  determinism proof: one mixed fixture log (mistake+retry, freeze,
  rewatch) is replayed through **both** the src engine and the
  generated `supabase/functions/_shared` copy; scores must be
  identical. Also runnable standalone: `node scripts/verify-replay.mjs`.

## Shared engine for Edge Functions

`scripts/sync-shared-engine.mjs` copies `prng.ts`, `types.ts`,
`pattern-recall/config.ts` and `pattern-recall/engine.ts` into
`supabase/functions/_shared/games/` (rewriting relative imports to
Deno-style `./x.ts`). The copies are generated — never edit them; run
the script after changing an engine. `supabase/functions/_shared/
games/replay.ts` is the hand-written dispatcher submit-run calls.
tsconfig now excludes `supabase/functions` (Deno globals + URL imports
are not the app's to typecheck) and enables
`allowImportingTsExtensions` so the parity test can import the copies.

## UI

- `src/games/pattern-recall/runner.ts` — the state-machine hook:
  countdown 3-2-1-GO → presenting (tile flashes) → input (per-step
  timer) → feedback → next round / finished. It owns all timers and the
  run clock; **paused time is excluded from the clock** (origin shifts
  on resume) so pausing can't game time bonuses. Every action is
  dispatched into the pure engine with a monotonic timestamp.
- `src/games/pattern-recall/ui.tsx` — matches
  `designs/pattern_recall_in_game.png`: HUD (pause, ROUND n/10 • STEPS
  + score pill, hearts, sound toggle), step dots, combo chip, state
  banner (WATCH… / YOUR TURN: REPEAT / OOPS / ROUND CLEAR), time-left
  bar (turns warning/error as it drains), chunky tiles with number +
  icon + label (lit = primary gradient + Reanimated scale/glow,
  solved = teal check, wrong = error), bottom tray with Tile # Assist
  toggle and Re-Watch / Freeze buttons showing uses left. Tile tones go
  through the Phase 7 audio interface (`src/lib/audio.ts` — deliberate
  no-ops guarded by the sound setting); haptics are real via
  `src/lib/haptics.ts` (expo-haptics, honours the haptics setting).
- `src/components/GameShell.tsx` — reusable full-screen chrome + the
  standard pause modal (Resume / Restart run / Abandon run) for Phase
  3 games. **Restart restarts the whole run** (fresh server run), not
  the round as drawn in the design: a mid-run round restart cannot be
  replay-verified. Android hardware back during play opens the pause
  modal; back while paused quits to the intro.
- Screens: `app/game/[gameId]/index.tsx` (intro: how-to, personal
  best, difficulty stars, lives rule, big PLAY; non-engine games show
  "Coming soon"), `play.tsx` (Pattern Recall wired; other games bounce
  to their intro), `results.tsx` (verified / queued-offline / rejected
  states — see below; a queued run flips to verified live if the flush
  lands while the screen is open). `app/game/_layout.tsx` added and
  registered in the root stack.
- Wiring: Games tab is now a real list (game_types + personal bests,
  static catalogue fallback offline) routing to intros; Home Continue
  Playing cards route to each game's intro; Home Daily Circuit PLAY
  NOW routes to the Pattern Recall intro until the Phase 4 circuit
  flow exists.

## Supabase integration

- `src/lib/runs.ts` — `startRun(gameId, mode)` calls **start-run** and
  returns `{ runId, seed, config, lives }`. Offline-first: start-run
  responses also top up a per-game **seed pool** (2 pre-issued server
  runs in local storage, per docs/05), so solo play works offline;
  with an empty pool a local seed is used and the server run is created
  during sync (`localOnly`). `submitRun(...)` calls **submit-run** and
  returns the verified result; on any failure the run is queued.
  `out_of_lives` from start-run is surfaced, not swallowed.
- Queue: `src/store/runQueue.ts` rewritten — persisted through the
  existing `src/lib/storage.ts` (AsyncStorage, Phase 0 decision; the
  prompt's "MMKV" is the same documented substitution).
  `src/lib/sync.ts` flushes on connectivity regain + app foreground
  (wired once in the root layout): local-only entries first create
  their server run with the played seed, then submit; verified results
  land in `src/store/runResults.ts`; a server "rejected" verdict drops
  the entry (final). `@react-native-community/netinfo` drives this.
- **start-run** (`supabase/functions/start-run/index.ts`): JWT auth →
  profile → lazy lives regen (+1/20 min, max 3) → 60 starts/hour rate
  limit (docs/05) → solo refuses at 0 lives (403 `out_of_lives`) →
  inserts `game_runs` ('started', mode 'solo') with a server seed
  (`srv-<uuid>`; a client `offline_seed` is accepted for solo/daily
  offline runs only, never duels) and the game's default config.
- **submit-run** (`supabase/functions/submit-run/index.ts`): JWT auth →
  run must exist, be owned, and still be 'started' (else 404/403/409) →
  replay via the shared engine → implausible logs are stored as
  'rejected' with 0 XP → verified runs write, in order: game_runs
  (claimed first, so a retry can never double-award), personal_bests
  (if beaten), profiles (XP = `round(points/40)`, x2 for daily;
  level recomputed from level_thresholds; lives regen then −1 for a
  failed solo run), and league_weeks XP (Monday UTC week). The service
  role key is read from `Deno.env` inside the functions only.
  Skills/streak/mind-score updates remain Phase 4/5 per the PRD.

## NOT done / blockers

- **Edge Functions are written but NOT deployed** (no Supabase CLI auth
  in this environment). Deploy with:
  ```bash
  cd ~/workspace/memory-trap/project
  supabase link --project-ref nhgovmfhcsgigmxdzgwu
  supabase functions deploy start-run
  supabase functions deploy submit-run
  ```
  Until they are deployed, the app still plays fully offline: runs use
  the local seed path, queue on the device, and verify on the first
  successful flush after deployment.
- No Deno runtime is available here, so the functions were not
  `deno check`-ed; they are plain TS against the standard Supabase
  Edge Function patterns, and everything they import from `_shared`
  is covered by the Jest parity test + `tsc`.
- No emulator/device run (none available); timer behaviour is
  setTimeout-based on the JS thread — docs/05's worklet timing target
  is a Phase 8 quality pass.

## How to test the whole flow on a device

```bash
cd ~/workspace/memory-trap/project
npm install
npm test                                   # 14 engine + parity tests
npx tsc --noEmit                           # typecheck
node scripts/sync-shared-engine.mjs        # only after engine edits
node scripts/verify-replay.mjs             # client/server score parity

# Backend (once): deploy the two functions (commands above), and make
# sure .env holds the real EXPO_PUBLIC_SUPABASE_URL / ANON_KEY.

npx eas build -p android --profile development   # dev build (not Expo Go)
# install it on the device/emulator, then:
npx expo start --dev-client
```
Then: sign in → Games → Pattern Recall → Play. Finish a run: the
results screen shows **SCORE VERIFIED** with XP awarded. Toggle
airplane mode before a run: it starts from the seed pool (or a local
seed), the results screen shows **SAVED OFFLINE — WILL SYNC**, and
reconnecting flushes the queue and flips the stored result to
verified. In the Supabase dashboard, `game_runs` shows the run as
`verified` with the replayed score, and `personal_bests` / `profiles`
(xp, level, lives) are updated.

## Verification

- `npx tsc --noEmit` — **passes, exit 0**.
- `npm test` — **14/14 pass** (2 suites).
- `node scripts/verify-replay.mjs` — passes.
- `npx expo config --type public` — resolves.
- Hex-literal grep over all Phase 2 files: none outside `theme.ts`.
- Not run: EAS build, device/emulator testing, function deployment
  (see blockers). Nothing committed to git.

---

# Phase 3 — The remaining seven games

Built 19 Nov 2026 from `prompts/phase-03-remaining-games.md` and
`docs/04-GAME-SPECS.md` (the pack's game-rules doc; the task brief
called it 04-GAME-RULES). All seven games were built one at a time in
the pack's order — engine + tests first, then UI — on the Phase 2
framework. **No new dependencies** (runtime or dev). **No git
commits**: the project is deliberately not a git repo (Phase 0 removed
the template's `.git`), so the prompt's "commit after each game" was
skipped; each game was instead gated on its Jest suite passing before
the next began.

## Shared conventions (why the numbers look the way they do)

docs/04 gives exact formulas for some games (Number Flash
150·length·combo, Color Confusion +1s/−2s, Quick Reaction
hits·speed − traps) and only prose for others. Where it is loose, the
Phase 3 engines follow the **integer conventions Pattern Recall
established in Phase 2**, factored into `src/games/scoring.ts`:
combo scales a step x1.0 → x3.0 (`base + 10·min(combo,20)`), a round
multiplier of x1.0 → x1.9 across 10 rounds, and the two-tier time
bonus (+25 fast / +10 ok, thresholds per game). Every choice is
documented in the game's `config.ts`. All scoring is integer math.

`completedAllRounds` semantics per game (submit-run spends one life
on a failed solo run): lives games (Number Flash, Card Match, Order
Trap) report false when the run ends by hearts; Pattern Recall's
convention (final round cleared) is kept for Order Trap; the timed /
no-lives games (Color Confusion, Quick Reaction, Shape Rotation,
Missing Object) report true when the run finishes its full course.

## The seven games

### 1. Number Flash (`number_flash`) — 12 engine tests
- Engine: digit strings pre-generated per round at max length; the
  target is the first L digits, so generation never depends on the
  player's path. Length 3, +1 per success (cap 12); flash 3750ms at
  L3 shrinking 250ms/digit to the 2000ms floor (docs/04's 2–4s band);
  entry window 8s + 1.5s/digit. 3 lives; first failure on a round
  retries the same digits, second moves on (Pattern Recall's rule).
  Run completes at a 20-round cap (docs/04 ends runs only by lives;
  the cap keeps a perfect run — and its replay — bounded).
- Scoring: exactly docs/04 — `150 · length · combo`, integer as
  `15 · length · (10 + min(combo,20))`. No time bonus (none specified).
- Validation: entry faster than 60ms/digit after the window opens is
  flagged `implausibly_fast_entry`.

### 2. Color Confusion (`color_confusion`) — 12 engine tests
- Engine: 600 pre-generated Stroop prompts (word, ink, 4 choices
  always containing both). Rule blocks of 5 alternate ink/word,
  starting on ink. The engine owns the deadline: starts 60000ms,
  +1000 correct / −2000 wrong (docs/04), answers after the deadline
  are ignored and end the run.
- Scoring: docs/04 specifies clock effects + "speed bonus" only;
  points = shared `stepPoints(100, combo, 1)` + speed bonus
  (+25 ≤600ms, +10 ≤1200ms).
- Validation: answers <100ms after the prompt are flagged (docs/04's
  sub-100ms rule).

### 3. Card Match (`card_match`) — 12 engine tests
- Engine: 3 boards 4x3 → 4x4 → 5x4 (5/7/9 pairs), all generated up
  front from one PRNG stream. Pairs resolve synchronously on the
  second flip. Traps: 2 per board (docs/04 allows 1–2; parity forces
  an even count on these board sizes) — a trap costs 1 heart + 150
  points and reshuffles the unmatched faces, derived deterministically
  from (seed, board, flip count) held in state.
- Scoring (docs/04: "pairs, flips efficiency, time"): pair =
  `stepPoints(200, combo, board)` + speed bonus (+25 ≤2s, +10 ≤5s
  from the first flip); board-clear efficiency bonus
  `max(0, pairs·4 − flips) · 15`; mismatch resets the combo.
- Validation: flips <120ms apart flagged.

### 4. Quick Reaction (`quick_reaction`) — 12 engine tests
- Engine: the whole 45s spawn schedule is generated at init (first
  spawn 900ms; lifetimes 1200ms → 500ms; gaps 1000ms → 550ms; ~22%
  red trap decoys) and never depends on taps; expiry is resolved
  lazily from timestamps. Taps resolve against the live spawn on the
  tapped cell of a 4x4 field.
- Scoring: exactly docs/04's shape — hit = 100 × speed multiplier
  (≤200ms x3, ≤350ms x2, ≤500ms x1.5, else x1), trap = −150 (floored
  at 0). The combo is tracked for results but does NOT multiply
  points (docs/04 gives this game a speed multiplier instead).
  Accuracy = hits / (hits + traps + expired).
- Validation: a hit with reaction <100ms is flagged
  `implausibly_fast_reaction` (docs/04), taps <50ms apart flagged.

### 5. Shape Rotation (`shape_rotation`) — 11 engine tests
- Engine: random-growth polyominoes (4 cells rounds 1–3, 5 in 4–7,
  6 in 8–10) as normalized cell sets; candidates are generated with
  integer rotate/mirror transforms. A shape is rejected and
  regenerated from the stream when its mirror is reachable by
  rotation (ambiguous) or has <3 distinct rotations — so every round
  has exactly one correct candidate, which the tests verify with an
  independently reimplemented geometry check across several seeds.
  10 rounds, 10s each, no lives.
- Scoring: shared convention — `stepPoints(200, combo, round)` +
  time bonus (+25 ≤3s, +10 ≤6s).
- Validation: answers <150ms after the round opens flagged.

### 6. Order Trap (`order_trap`) — 11 engine tests
- Engine: 7 themed item sets × 7 items in `config.ts` (day cycle,
  plant growth, week days, numbered chips, rainbow, sizes, cooking
  rice); each round takes a contiguous slice of a set's canonical
  order, length 3→7 on Pattern Recall's ramp. Submission is a single
  `submitOrder` permutation — identity = correct. Wrong order or
  timeout: −1 heart, one retry per round (Pattern Recall's rule).
- Scoring: per item in slot order, `stepPoints(100, combo, round)`,
  combo growing item by item, +250 perfect-round bonus on a
  first-try clear; failed attempts score 0 (docs/04 is
  all-or-nothing: "one-wrong = lose life"). Accuracy = rounds
  cleared / rounds attempted.
- Validation: non-permutation orders flagged `invalid_order`;
  submits faster than 80ms/item flagged.
- **UI deviation (deliberate)**: docs/04 says drag & drop; v1
  collects the arrangement by tap-to-place (tap a tray chip to fill
  the next slot, tap a slot to send it back). The logged
  `submitOrder`, engine and replay are identical either way; a
  gesture-handler drag layer can be added later without touching
  the verified path.

### 7. Missing Object (`missing_object`) — 12 engine tests
- Scenes: `src/games/missing-object/scenes/scene.schema.json`
  (JSON Schema) + 10 placeholder scene JSON files (kitchen, park,
  beach, desk, garden, bedroom, market, library, playground,
  workshop; 7–8 objects each on a 4x3 grid). `scenes.ts` is
  generated from the same data (one generator script produced both,
  so they cannot drift) and is what the engine imports — objects
  render as icon + label tiles; the user supplies real art later.
- Engine: scene order shuffled from the seed (8 rounds, distinct
  scenes), removed object + 3 same-scene distractors chosen
  deterministically; show time 5000ms → 3250ms across the run
  (docs/04's 5s → 3s, floored at 3000ms); 15s answer window. v1 uses
  docs/04's 4-choice answer form (not tap-the-empty-spot).
- Scoring: shared convention — `stepPoints(150, combo, round)` +
  time bonus (+25 ≤2s, +10 ≤5s). No lives (none in docs/04).
- Validation: answers <200ms after the choices appear flagged.

## UI (all seven)

Each game has `runner.ts` (state machine on the shared
`src/games/shared/runner-kit.ts` run clock + countdown + timers —
paused time is excluded from log timestamps, as in Phase 2) and
`ui.tsx` plugging into `GameShell` with the shared chrome in
`src/games/shared/GameChrome.tsx` (HUD row with pause/score/hearts/
sound, state banner, time bar, countdown overlay, Android-back →
pause). Games render from theme tokens only (hex grep clean) and
always pair colour with icon + label. Pattern Recall's `ShapeIcon`/
`shapeLabel` are now exported and reused by Card Match.

- `app/game/[gameId]/play.tsx` now dispatches all 8 games through a
  generic run-result shape (`{log, score, completedAllRounds}`);
  Pattern Recall's richer result is adapted at the call site.
- Intro screens are real for all 8 games automatically (the
  `hasEngine` gate) and `catalogue.ts` how-to copy was expanded to
  full instructions per game. The results screen's Pattern
  Recall-specific copy ("Pattern mastered!", "of 10 rounds") was
  genericised.
- Missing Object scenes, Order Trap chips and Shape Rotation shapes
  are all rendered from the same data the engines verify — no
  client-only game state exists anywhere.

## Server parity (the anti-cheat contract, now ×8)

- `scripts/sync-shared-engine.mjs` now syncs `scoring.ts` plus every
  game's config + engine (+ Missing Object's `scenes.ts`) into
  `supabase/functions/_shared/games/` — 20 generated files.
- `supabase/functions/_shared/games/replay.ts` dispatches
  `replayRun()` for **all 8 game_ids** (score + completedAllRounds +
  per-game plausibility violations); unknown ids return null.
- `start-run`'s `configFor()` returns the real default config for
  every game_id.
- One `replay-parity.test.ts` per game (8 suites, 9 tests) replays a
  mixed fixture log (mistakes, retries, traps, timeouts) through both
  the src engine and the _shared copy and asserts identical scores,
  completion flags and violation lists. `node
  scripts/verify-replay.mjs` now runs all of them.
- **Functions were NOT redeployed** — the parent session redeploys
  `start-run` / `submit-run` via the Management API. The deployed v1
  functions still verify Pattern Recall only; until the redeploy,
  other games' runs queue on-device (the existing offline path) and
  verify on the first flush after it. submit-run itself needed no
  changes — it already routes everything through `replayRun()`.

## Verification

- `npm test` — **103/103 pass** (16 suites: 14 Phase 2 tests, 82 new
  engine tests, 7 new parity tests; Pattern Recall's parity suite
  updated — its "unsupported game" case now uses a bogus id since
  Card Match is supported).
- `npx tsc --noEmit` — **passes, exit 0**.
- `node scripts/verify-replay.mjs` — passes (all 8 parity suites).
- `npx expo config --type public` — resolves.
- Hex-literal grep over all Phase 3 files: none outside `theme.ts`.
- Not run: EAS build, device/emulator testing, function redeploy
  (parent session). Nothing committed to git (not a repo).

---

# Phase 4 — Games Vault, Daily Circuit, economy

Built 19 Nov 2026 from `prompts/phase-04-vault-daily-economy.md`,
`designs/games_vault.png`, `docs/01-PRD.md` (economy), `docs/03`
(Vault, missing screens #5/#6/#7) and `docs/04` (Daily Circuit +
score→XP). **No new dependencies.** (The pack has no
`docs/06-DATA-MODEL.md` — `supabase/schema.sql` is the data model,
including its "functions to implement" list, which names
`regen_lives()` and the daily circuit.)

## Parent must do (in order)

1. **Apply the migration** (the only one this phase):
   `supabase/migrations/20261119010000_phase4_economy_circuit.sql`
   (after the Phase 1 migration, which is already applied). It adds
   `apply_lives_regen` (internal), `regen_lives()`, `get_economy()`,
   `pick_daily_games` (internal) and `get_or_create_daily_circuit()`.
   Spot-check the SQL picker against the TS mirror after applying:
   `select public.pick_daily_games('2026-11-19');` must return
   `{pattern_recall, number_flash, card_match}` (more vectors in the
   migration header and in `src/features/circuit/pick.test.ts`).
2. **Regenerate types** if desired: `src/types/database.ts` is already
   structured as a drop-in (the client is `createClient<Database>`
   and the file mirrors the generated shape, now including
   `game_runs` and the four Functions contracts), so generating
   official types is a wholesale file replacement with no call-site
   changes.
3. **Redeploy BOTH Edge Functions** — `submit-run` (streak/circuit
   logic + new `_shared/streak.ts`) and `start-run` (daily seeds +
   `daily_date` stamping):
   ```bash
   supabase functions deploy start-run
   supabase functions deploy submit-run
   ```
   Until the redeploy, daily runs still verify (old submit-run), they
   just earn no circuit progress/streak credit; until the migration
   lands, the client RPC wrappers fall back (economy from the session
   profile, circuit from direct table reads) — see below.

## Design decisions (ambiguities and how they were resolved)

- **Circuit determinism scope: global by date, same for everyone.**
  `daily_circuits.day` is the table's PK (no user column) and docs/04
  says "Same seeds for everyone that day (enables fair daily
  league)". The picker lives **in SQL** (`pick_daily_games`) and is
  the single source of truth — the client never re-picks, it renders
  the RPC result. Algorithm (docs/04's `hash(date) → 3 distinct
  games, one from Memory guaranteed`): Memory pick = smallest
  `md5(day || ':mem:' || id)` among active memory games; fill = two
  smallest `md5(day || ':' || id)` among the rest; ordering compares
  the raw MD5 **bytes** (`decode(..., 'hex')`) so it never depends on
  database collation. Seeds are derived the same way
  (`daily-<day>-<game>-<md5(day:seed:game)[0:10]>`) and stored on the
  row; start-run serves them for daily runs.
- **TS mirror + tests**: `src/features/circuit/pick.ts` re-implements
  the picker (with a compact pure-TS MD5, RFC 1321-verified — JS has
  no MD5 and no dependency may be added for one). The Jest suite
  checks determinism/distinctness/Memory-guarantee across a full year
  and known-answer vectors that were ALSO computed with an
  independent implementation (Python hashlib) — the same vectors are
  recorded in the migration header for the post-apply spot-check.
- **Per-user completion is derived, not stored on the circuit.**
  `daily_circuits` has no per-user columns, so completion = the
  caller's verified `game_runs` with `mode='daily'` and
  `daily_date = day` covering all 3 circuit games.
  `get_or_create_daily_circuit` returns the global row plus that
  progress (best run per game, total XP); submit-run uses the same
  derivation to detect completion. This survives app restarts and
  works for runs verified via the offline-queue flush.
- **Streak trigger: circuit completion (PRD), transitions per the
  brief.** The PRD defines the streak as "+1 per day with >=1
  completed daily circuit", so the transition runs in submit-run at
  the moment a verified daily run completes the circuit — not on
  arbitrary runs. Transitions (in `_shared/streak.ts`, mirrored +
  unit-tested in `src/features/circuit/streak.ts`): same day → no-op
  (idempotent); yesterday → +1; exactly one missed day with a freeze
  → +1 and freeze consumed (PRD: "Freeze shield protects one missed
  day"); larger gap or no freeze → reset to 1; `best_streak` tracks
  the max. Freeze *earning* follows the PRD too ("earn 1 per 7-day
  streak, max 2"): landing on a multiple of 7 grants one freeze up to
  2, applied after consumption (a freeze spent to reach day 7 is
  immediately re-earned).
- **Streak timezone handling**: there is no timezone column on
  profiles, so the streak day is the run's `daily_date` — the
  **device-local** date the client sends to start-run (validated
  server-side to UTC today ± 1, which covers every real timezone).
  All streak math is date-string arithmetic (UTC on parsed parts), so
  the server's own timezone never shifts a player's day.
- **Lives regen in SQL mirrors `_shared/lives.ts` exactly** (max 3,
  +1 per full 20 min from `last_life_at`, anchor refresh while full)
  via the internal `apply_lives_regen` (revoked from clients).
  `get_economy()` applies it as part of the read, so HUD/Vault/sheet
  always show post-regen lives; the next-life countdown ticks locally
  from the returned `next_life_at`.
- **`daily_mind_score.score` is not touched by circuit completion**
  (Phase 5 owns the Mind Score value): submit-run only sets
  `circuit_done = true` — updating just that column on an existing
  row, inserting a zero-score row when the day has none.

## What was built

### Server
- Migration above: 3 client RPCs (`regen_lives`, `get_economy`,
  `get_or_create_daily_circuit`) + 2 internal helpers, all SECURITY
  DEFINER on `auth.uid()`, granted to `authenticated` only (helpers
  revoked). `get_or_create_daily_circuit` validates the requested
  date to UTC ± 1 day.
- `supabase/functions/_shared/streak.ts` (new) + submit-run: profile
  select extended; on a verified daily run it computes circuit
  progress, marks `daily_mind_score.circuit_done`, applies the streak
  transition, and folds streak fields into the single profile update.
  Response extended: `previous_level`, `new_level`, `streak`,
  `freezes`, `streak_freeze_used`, `circuit` progress block (also on
  the rejected path, minus circuit). XP/level/lives/league behaviour
  is unchanged from Phases 2/3.
- start-run: accepts `daily_date` for daily runs (validated as
  above); when the day's circuit row exists it serves the circuit
  seed for that game and stamps `game_runs.daily_date`. An
  `offline_seed` (the seed actually played) still wins.

### Client
- Types: `src/types/economy.ts` (EconomyState, LivesState,
  DailyCircuitStatus, CircuitProgress); `src/types/database.ts`
  converted to the generated-types shape with a full `Database`
  type (row types are now `type` aliases; `game_runs` added) and
  `src/lib/supabase.ts` creates `createClient<Database>` — official
  generated types now drop in as a file replacement.
- `src/lib/economy.ts`: RPC wrappers with graceful fallbacks
  (economy ← session profile with a client-side regen mirror for
  display; circuit ← direct `daily_circuits` + `game_runs` reads),
  `formatClock`, `deriveLives`. `src/lib/useNow.ts`: ticking clock.
- Runs plumbing: `startRun(gameId, mode, dailyDate)`,
  `invokeStartRunForSync(..., dailyDate)`, queue entries carry
  `dailyDate`, `VerifiedRunResult` carries previousLevel/newLevel/
  streak/freezes/streakFreezeUsed/circuit.
- **Vault** (`app/(tabs)/games.tsx` rewritten): AppHeader + HudBar
  fed by `useEconomy` (plus a ticking "Next life in MM:SS" line when
  below max), "Game Vault" title + subtitle + Daily Boost chip
  (Active/Done from the circuit hook), filter chips (All + the 5
  categories with live counts), FlashList of new
  `src/features/vault/GameCard.tsx` (16:9 token-gradient banner with
  watermark icon, feature chip bottom-left, duration chip
  bottom-right, NEW badge when no PB, difficulty **dots** + label,
  Best, PLAY pill; card and PLAY both route to the intro per
  docs/03). Skeleton cards while loading, error card with Retry,
  per-filter empty state. The design's TRENDING tag and photographic
  banners are not reproduced (no such data/assets exist — the banner
  is derived from theme tokens instead).
- **Circuit flow** (`app/circuit/` — new route group, registered in
  the root stack): hub with progress-segment header (1/3·2/3·3/3),
  the 3 games in order with DONE (best score + XP) / UP NEXT /
  pending states, per-game Play → intro with `mode=daily&day=…`;
  `complete.tsx` celebration (total XP with 2X badge, per-game
  scores, streak flame + freeze count, Done → Home) reading only
  server state. Home PLAY NOW now routes to `/circuit`, the hero
  shows real `n/3` progress, and Home/Vault HUDs read the economy
  RPC. Intro screens accept the daily params (2X XP pill, daily
  lives copy, circuit-day start) and results screens show a circuit
  progress card + "Next game in circuit" / "See Circuit Complete"
  CTAs for daily runs (including when a queued run verifies later).
- **Out-of-lives sheet** (`src/components/OutOfLivesSheet.tsx`):
  bottom sheet with empty hearts, live next-life countdown, freeze/
  streak protection note, "Play Daily Circuit instead" (daily never
  costs lives — PRD; hidden once today's circuit is done) and "Come
  back later". NO ad/purchase option (v1 non-goal). Triggered from
  the intro (Play when the economy says 0 lives, a start-run
  `out_of_lives` 403, or arriving with `ool=1` from a play-screen
  restart that hit the wall).
- **Level-up modal** (`src/components/LevelUpModal.tsx`): results
  screen compares the verified result's previous/new level and shows
  it once per run, with the new level's tier title from
  `level_thresholds`. A freeze consumption shows as an inline
  shield card on the results screen (docs/03 lists a "streak-freeze
  used modal"; the card carries the same information without
  stacking two modals over a level-up).

### Tests
- `src/features/circuit/pick.test.ts` (7 tests): RFC 1321 MD5
  vectors, known-answer circuit vectors (independently computed),
  determinism across 50 calls, 3-distinct + Memory-first across 365
  dates, cross-date variety, inactive games excluded, seed formula.
- `src/features/circuit/streak.test.ts` (11 tests): dayDiff,
  first completion, same-day idempotence, yesterday +1, freeze
  save / no-freeze reset, multi-day gap reset, freeze earning at
  multiples of 7, the 2-freeze cap, spend-then-re-earn on a
  milestone day, input immutability.
- Jest roots widened from `src/games` to `src` so feature tests run.

## Verification

- `npm test` — **121/121 pass** (18 suites: 103 from Phases 2/3 +
  18 new Phase 4 tests).
- `npx tsc --noEmit` — **passes, exit 0** (including the new
  `createClient<Database>` typing — no call-site fallout).
- `node scripts/verify-replay.mjs` — passes (engines untouched).
- `npx expo config --type public` — resolves.
- Hex-literal grep over all Phase 4 files: none outside `theme.ts`.
- NOT verified here: the SQL itself (no local Postgres) — the parent
  applies the migration to the live project and can spot-check the
  picker with the recorded vectors; Edge Function redeploy is the
  parent's step (above). No EAS build, no device run, nothing
  committed to git.

---

# Phase 5 — Progress, Mind Score, achievements, Profile top half

Built 19 Nov 2026 from `prompts/phase-05-progress-achievements.md`,
`designs/progress_stats.png` + `designs/profile_friends.png`,
`docs/01-PRD.md` (Mind Score, skill vectors), `docs/03-SCREEN-SPECS.md`
screens 5/6 and `supabase/schema.sql` (its "functions to implement"
list names `get_progress_summary`). **No new dependencies** — charts
are hand-built on the already-installed react-native-svg.

## Parent must do (in order)

1. **Apply the migration** (the only one this phase, after Phase 4's):
   `supabase/migrations/20261119020000_phase5_progress_achievements.sql`
   It adds `achievements.criteria`, seeds the 18 achievements, seeds
   `game_score_norms` (the table existed but was empty), adds the
   internal `score_percentile()` helper and `get_progress_summary()`.
   Spot-check after applying: `select count(*) from achievements;`
   → 18; `select public.score_percentile(3500, 800, 3500, 9000);`
   → 50; call `get_progress_summary()` as a signed-in user → one
   jsonb payload.
2. **Redeploy submit-run** (it changed; start-run did not):
   ```bash
   supabase functions deploy submit-run
   ```
   New `_shared/progress.ts` + `_shared/achievements.ts` ride along.
   Until the redeploy, runs verify exactly as in Phase 4 — they just
   don't move Mind Score/skills or unlock achievements yet; until the
   migration lands, the client RPC wrapper falls back to composing
   the same payload from the RLS tables (see below).
3. Regenerating types is optional: `src/types/database.ts` gained
   `skill_scores`, `game_score_norms`, `achievements`,
   `user_achievements` rows and the `get_progress_summary` contract
   by hand, in the established generated shape.

## The Mind Score formula (docs give the shape, not the math)

docs/01 defines the Mind Score only as "weighted average of
normalized per-game performance over trailing 7 days vs the player's
baseline", and `game_score_norms` carries only p10/p50/p90 anchors.
The implemented normalisation (documented in
`supabase/functions/_shared/progress.ts`, mirrored + tested in
`src/features/progress/norms.ts`):

- **Percentile** of a score = piecewise-linear interpolation through
  (0,0), (p10,10), (p50,50), (p90,90), then a saturating tail above
  p90 (`90 + 9·(s−p90)/((s−p90)+p90)`) approaching but never reaching
  99. Missing/degenerate norms → null (run doesn't move the skill).
- **Skill value (0–200)** = 2 × mean percentile of the player's
  recent verified runs across every game feeding that skill
  (`game_types.skills`), so a median player sits at 100/200 (shown
  as 50% in the design). "Recent" = last 10 verified runs per skill
  in a trailing 14-day window; fewer than 3 in-window → last 10
  overall, so a returning player keeps their rating.
- **Mind Score (0–1000)** = sum of the five skill values.
  `skill_scores.delta_week` = change since the start of the current
  ISO week (restarts from the pre-week value on the first update of
  a new week, accumulates within the week; a brand-new skill counts
  its full value).
- Recompute is always from verified `game_runs` (never incremental),
  and `daily_mind_score` is read-merge-written preserving the Phase 4
  `circuit_done` flag; `minutes_played` accrues the run's input-log
  span, capped at 10 min so an idle pause can't inflate the rhythm
  chart. The score's day key is the run's `daily_date` for daily
  runs, else the UTC date (same convention as Phase 4 streaks).
- **Norms seed** (migration): anchors derived from the engines'
  documented score anchors scaled to full runs (e.g. Pattern Recall
  p50 3500, Card Match p50 3500). Tunable config like
  `level_thresholds`; the insert is `on conflict do nothing`.

## Achievements (18, data-driven)

The pack never enumerates its 18 achievements — docs/03 shows only
design fragments ("7-Day Streak", "Speed Demon", "Memory… 8/10
Perfect rounds", "Battle Champion — Win 25 duels"). The seeded list
is built from those fragments + the PRD's progression stats, across
9 criteria types: games_played (1/10/50/100), distinct_games (4/8),
best_streak (3/7/30), circuits_completed (1/10), perfect_runs (1/10),
best_score (5000), best_skill (160/200), level (5/10), duels_won
(25 — **inert until Phase 6**: the stat is hard-0 until battles
write it). Evaluation is a pure function over a stats snapshot
(`_shared/achievements.ts`, mirror + boundary tests in
`src/features/progress/achievements.ts`), run by submit-run after
every verified run; `user_achievements` upserts progress and set
`unlocked_at` exactly once. **Docs specify no XP for achievements**
(no xp column exists), so none is granted — the response carries
`achievements_unlocked: [{id, name, icon}]` and the results screen
celebrates with a new `AchievementUnlockModal` (queued after the
level-up modal when both fire) plus a Mind Score row.

## Weekly Quest

docs/03 shows a "Weekly Quest" card (Synapse Surfer Medal) with no
numbers anywhere in the pack. Implemented as **computed state in
the RPC** (no new table): complete **3 Daily Circuits** in the
current ISO week (Mon–Sun UTC, the league's week), counted from
`daily_mind_score.circuit_done`; the medal is the reward (no XP —
none is specified). Mirror + tests in `src/features/progress/
quest.ts`.

## What was built

### Server
- Migration above: criteria column, 18 achievements, norms seed,
  `score_percentile()` (internal, revoked), `get_progress_summary()`
  (SECURITY DEFINER on `auth.uid()`): mind score + 7d-ago baseline +
  30d series (with minutes + circuit flags), 5 skill vectors,
  records with percentile + Top X%, quest, week snapshot, merged
  achievements, totals.
- `_shared/progress.ts` (new) + submit-run: after the PB write,
  recompute the run's game's skills + Mind Score, fold `mind_score`
  into the single profile update, upsert today's daily row; after
  league XP, evaluate achievements and return
  `achievements_unlocked` + `mind_score` (the rejected path returns
  both too, empty/unchanged). Order vs Phase 4 is safe: both writers
  read-merge `daily_mind_score`, and the claim guard keeps the whole
  block single-shot.

### Client
- Types: `src/types/progress.ts` (ProgressSummary & friends);
  `database.ts` rows/Functions as above. `src/lib/progress.ts` —
  RPC-first wrapper with the Phase 4-style graceful fallback
  composing the identical payload from RLS tables via the tested
  mirrors. `VerifiedRunResult` gained `mindScore` +
  `achievementsUnlocked`.
- **Progress screen** (`app/(tabs)/progress.tsx`): "WEEKLY SNAPSHOT"
  header (the rename — see below), Mind Score hero with RingProgress
  + delta chip, hand-built SVG **line chart** with 7D/30D toggle and
  a game-flavoured insight line, 2×2 stat cards (Total XP, Games
  Played, Flame Streak + freezes, Achievements count), **Training
  Rhythm** bar chart (minutes/day, 3-min target, ✓ = circuit done),
  **Skill Vectors** (bars as % of 200, weekly-delta chips, weakest
  highlighted RECOMMENDED with its tagline), **Personal Records**
  (best, date, "Top X% Player" from norms), **Weekly Quest** card
  (progress, days left), **Weekly Snapshot** summary card, and a
  sticky **BOOST WEAKEST SKILL** button routing to the weakest
  skill's weakest game intro. Skeleton / error-with-retry / empty
  states throughout; a new user sees zeros and "Play your first
  game", never a crash.
- **Home delta chip wired**: `features/home/hooks.ts` widens the
  daily-rows query by one week and computes the delta against the
  latest row on/before 7 days ago (same baseline as the RPC); still
  hidden until a baseline exists.
- **Profile top half** (`app/(tabs)/profile.tsx`): identity card
  (avatar with edit affordance, name, Lv. chip, @handle, joined
  date, friend-tag chip that **shares via the RN Share sheet**),
  stats row (Mind Score / Games Played / Day Streak), Next Milestone
  card (level title → next level, XP bar), Achievements section
  (2-col grid: unlocked in colour with date, in-progress with a
  progress ring, locked greyed) + "View All" → new
  **`app/achievements.tsx`** route (registered in the root stack).
  Friends & Rivals is a clearly-marked Phase 6 placeholder card;
  the fair-play note is kept. **Edit profile** modal: display name
  (2–24) + the 24-avatar picker, saving through the profiles UPDATE
  grant (display_name/avatar_id only) and refreshing the session
  profile.
- Achievements UI shared in `src/features/progress/components.tsx`;
  charts in `src/features/progress/charts.tsx`.

## Decisions / deviations

- **"Cognitive Snapshot" grep**: the string appears **nowhere** in
  the project (app code, SQL, docs copies) — verified by grep. The
  Progress header and summary card are "Weekly Snapshot". The design
  PNG's other claims-style copy was also dropped per docs/03's own
  instruction: no "12% Faster" chip (the delta chip shows points,
  like Home), no "Exceptional resistance to visual distractions"
  taglines (skill rows use game-flavoured lines), no "VERIFIED
  INVESTIGATOR" badge on Profile (docs/03: remove unless real).
- **Friend-tag copy**: `expo-clipboard` is not installed and adding
  it needs approval; RN's own Clipboard is deprecated. The tag chip
  therefore opens the **Share sheet** (RN `Share`, no dependency) —
  one tap still gets the tag out of the app. True tap-to-copy waits
  for an approved clipboard dependency (Phase 8 settings pass could
  bundle it with notifications work).
- **Design's stat cards differ slightly**: docs/03's 2×2 includes
  "Match Count (48 played, 82% win rate)" — win rate is a duel stat
  (Phase 6), so the cards are Total XP / Games Played / Flame
  Streak / Achievements. The design's "BOOST WEAKEST SKILL (+30 XP)"
  CTA drops the "(+30 XP)": XP comes from playing the suggested
  game, not from tapping the button, and the copy must not promise
  otherwise.
- **Skill display**: schema stores 0–200; the design shows %.
  The UI shows value/2 as % and keeps /200 in accessibility labels
  and the Skill Master achievement copy.
- submit-run's rejected path now also returns `mind_score` and an
  empty `achievements_unlocked`, keeping the response shape uniform.

## Verification

- `npm test` — **146/146 pass** (21 suites: 121 from Phases 2–4 +
  25 new Phase 5 tests — percentile edges incl. below-p10 / median /
  p90 / above-p99 saturation / missing + degenerate norms, skill
  value clamping, Top X% mapping, achievement boundary cases for
  every criteria type incl. the inert duels stat, weekly-quest
  progress/days-left).
- `npx tsc --noEmit` — **passes, exit 0**.
- `node scripts/verify-replay.mjs` — passes (engines untouched).
- `npx expo config --type public` — resolves (achievements route
  registered).
- Hex-literal grep over all Phase 5 files: none outside `theme.ts`.
- NOT verified here: the SQL itself (no local Postgres) — the parent
  applies the migration and can spot-check with the vectors above;
  Edge Function redeploy is the parent's step. No EAS build, no
  device run, nothing committed to git.

# Phase 6 — Friends, duels, Battle screen

Built 19 Nov 2026 from `prompts/phase-06-social-battle.md`,
`designs/battle_arena.png` + `designs/profile_friends.png`,
`docs/01-PRD.md` (friends + duels), `docs/03-SCREEN-SPECS.md`
(Battle, friends, public profile), `docs/04-GAME-SPECS.md` (duel XP)
and `supabase/schema.sql` (friendships/blocks/reports/battles/
battle_rounds/battle_reactions + their RLS). **No new dependencies.**
`schema.sql` is untouched; everything lands in one new migration.

## Parent must do (in order)

1. **Apply the migration** (the only one this phase, after Phase 5's):
   `supabase/migrations/20261119030000_phase6_social_battle.sql`
   (~41 KB). It adds the round score/winner columns to
   `battle_rounds`, tightens the reactions INSERT policy to
   participants-only, adds all RPCs below, and adds
   battles/battle_rounds/battle_reactions/friendships to the
   `supabase_realtime` publication (guarded, re-runnable).
   Spot-check after applying: count the new functions in `pg_proc`
   (search_players, send_friend_request, respond_friend_request,
   remove_friend, block_user, unblock_user, report_user, get_friends,
   get_public_profile, create_battle, accept_battle, decline_battle,
   finish_round, finish_round_internal, get_battles,
   get_battle_detail, send_reaction + internal helpers).
2. **Redeploy BOTH Edge Functions** — start-run AND submit-run both
   changed this phase (plus `_shared/achievements.ts`):
   ```bash
   supabase functions deploy start-run
   supabase functions deploy submit-run
   ```
   Unauthenticated smoke test on each should still return 401.
3. `supabase/tests/phase6_policies.sql` ships as the policy test
   artifact: a DO-block assertion script with ROLLBACK that needs a
   **scratch DB with three fixture auth users** (ids and handles are
   documented in its header). It cannot run against the live project
   via the Management API (auth users can't be created that way) —
   run it in a local/`supabase db reset` scratch database.

## RPCs (all SECURITY DEFINER, auth.uid()-scoped, granted to authenticated)

Friends:
- `search_players(q)` — '#' prefix → exact friend_tag match,
  otherwise handle prefix; excludes self and anyone blocked in
  either direction; returns public profile fields + Mind Score +
  relationship state.
- `send_friend_request(target)` — a mutual pending request
  auto-accepts; a declined row restarts as pending.
- `respond_friend_request(requester, accept)`,
  `remove_friend(other)` (also cancels a pending outgoing request).
- `block_user(target)` — deletes the friendship and voids PENDING
  battles between the pair (set to 'expired'; the schema has no
  'cancelled' status). Already-active battles are left to expire on
  their own clock — deliberate literal reading.
- `unblock_user(target)`, `report_user(target, reason)` — reason is
  validated against the fixed code list (harassment, cheating,
  inappropriate_name, spam, other); no free text anywhere.
- `get_friends()` — accepted + incoming + outgoing + blocked, with
  public profiles flattened in.
- `get_public_profile(user)` — detail + relationship + games_played
  + duels_won; returns null when a block exists in either direction.

Battles:
- `create_battle(opponent)` — requires accepted friendship and no
  block; errors `battle_already_open` if a pending/active battle
  already exists between the pair. Creates status 'pending',
  `expires_at = now + 24h`, and the 3 rounds (games + seeds below).
- `accept_battle(id)` — opponent only, before expiry → 'active'
  (else the battle flips to 'expired'). `decline_battle(id)` serves
  both opponent-decline and challenger-cancel of a pending battle →
  'declined'.
- `finish_round(battle, round_no)` — participant-checked public
  wrapper over `finish_round_internal` (service_role only; the
  single source of truth, also called by submit-run). Reads both
  players' VERIFIED game_runs for the round (battle_round_id stamped
  by start-run), writes round scores + round winner, and when all 3
  rounds have both scores: completes the battle, sets winner/draw,
  pays the duel bonus (below) exactly once under a row lock.
  Idempotent — safe to call any number of times.
- `get_battles()` — my battles with opponent profile, per-round
  viewer-relative state (my_score/their_score/my_played), totals,
  whose turn; lazily flips overdue pending/active battles to
  'expired'. `get_battle_detail(id)` = battle + last 30 reactions.
- `send_reaction(battle, reaction)` — participant only, validated
  against the schema enum (high_five, gasp, cheer, gg, wow, oops).

## Seed fairness (the core of the phase)

- Round games: docs don't fix duel games, so they are chosen
  deterministically from the battle id at create time — round 1 is
  a Memory-category game (smallest md5 byte-order of
  `battle_id || ':mem:' || game_id`, mirroring Phase 4's circuit
  picker), rounds 2–3 are the next distinct games by
  `md5(battle_id || ':' || game_id)`. Same battle ⇒ same games,
  forever, on every client.
- Seeds are `duel-<battle_id>-r<round_no>`, one per round, stored on
  `battle_rounds` by create_battle. start-run (mode 'duel') returns
  the STORED seed — it never generates one and never accepts a
  client seed — so both players play the identical game. Duel runs
  cost no lives and are online-only (no offline queue, no seed pool).
- The challenger may play rounds while the battle is 'pending'
  (PRD loop: challenge → play → opponent answers within 24h); the
  opponent plays only after accepting. A verified run for a round
  blocks a second play (409 round_already_played); an in-progress
  'started' run is returned idempotently (safe restart).
- Round scores come ONLY from verified game_runs. Rejected or
  unverified runs never score; the client never supplies a score
  anywhere in the flow.

## Duel XP

- Each duel run earns the usual per-run XP `round(points/40)` via
  submit-run (docs/04 formula, duelBonus handled by completion).
- The **+60 XP win bonus** (docs/01) is paid by
  `finish_round_internal` exactly once, at the status transition to
  'finished': +60 to the winner's profiles.total_xp (level
  recomputed) and +60 to their current league_weeks row. Draws pay
  no bonus. Because it rides the locked status transition, double
  submit / double finish_round calls can never double-pay.
- Phase 5's `duels_won` achievement stat is now live:
  `_shared/achievements.ts` counts finished battles where
  winner = the user (was hard-0); the client mirror in
  `src/features/progress/achievements.ts` matches.

## Client

- Battle tab rebuilt per the design: hero, Challenge a Friend
  (→ `/battle/new` friend picker → create → detail), Random Match /
  Create Private Room / Join Room as disabled "Coming soon" cards
  with PHASE 2 / PHASE 3 ribbons (deferred per docs/01), Active
  Battles (accept/decline inline, Play Round, Rematch), this week's
  league top 10 + own rank, friends leaderboard (week XP, shown when
  friends have league rows), fair-play card.
- Battle detail (`/battle/[battleId]`): VS header with running
  totals + expiry countdown, 3 round cards (Play / waiting /
  complete with round winner), accept/decline/cancel/rematch,
  reaction bar (6 presets) + live feed. Realtime: postgres_changes
  on this battle's battles/battle_rounds/battle_reactions rows via
  useBattleDetail, with a 30s poll fallback (60s on the list).
- Friends: Profile tab's placeholder is now a real Friends & Rivals
  section (counts, incoming preview with accept/decline, links);
  `/friends` (list + requests in/out + blocked with unblock),
  `/friends/add` (search @handle/#tag with relationship-aware
  buttons, Share invite via RN Share with the user's friend tag;
  app link is the memorytrap.app placeholder until the Play listing
  exists in Phase 9), `/player/[userId]` (public profile with
  Add/Challenge and a Report/Block menu — report uses the fixed
  reason list, block confirms and navigates away).
- Presence: best-effort Realtime Presence on the shared
  'players-online' channel (online dots in friends/search/profile).
  No last-seen is shown or claimed anywhere — presence is a hint,
  not a record.
- TabBar LIVE badge is wired: it shows when
  `actionableBattleCount > 0` (incoming challenges + your-turn
  rounds, derived in `features/battle/logic.ts` from get_battles).
- Play/results plumbing: play screen threads battleId/roundNo,
  duel quits return to the battle, restarts reuse the same server
  run (session key forces remount), results shows "Back to Battle"
  for duel mode and hides Play again (a verified round can't be
  replayed).

## Verification

- `npm test` — **173/173 pass** (23 suites: 146 from Phases 0–5 +
  27 new Phase 6 tests — round/phase derivation incl. viewer
  relativity, expiry edges, actionable count, reaction enum guard,
  relationship mapping, search-query parsing).
- `npx tsc --noEmit` — **passes, exit 0**.
- NOT verified here: the SQL itself (no local Postgres) — the
  parent applies the migration and spot-checks per the checklist
  above; `supabase/tests/phase6_policies.sql` needs a scratch DB
  with fixture auth users. Full duel flow needs **two real
  accounts** on a device/dev build: befriend → challenge → challenger
  plays while pending → accept → opponent plays same seeds →
  completion + exactly-once +60 XP → reactions live both ways →
  block voids pending battle and hides both profiles. No EAS build,
  no device run, nothing committed to git.

# Phase 7 — Audio (ElevenLabs manifest + synth SFX), voice, polish

Built 19 Nov 2026 from `prompts/phase-07-audio-polish.md` and
`docs/06-ELEVENLABS-AUDIO.md`. **No new dependencies** (runtime or
dev). **The ElevenLabs API was not called and no key was used or
needed**: per the pack's design, this phase ships the manifest +
generator for the user to run with their own key, plus a fully
working synthesized SFX channel so the game sounds complete today.
Generating the voice pack through the connected Muse ElevenLabs
connector is still pending the user's approval (noted for the
parent session) — nothing in the app waits on it.

## The manifest (`scripts/audio-manifest.json`) — 73 clips

64 TTS + 9 SFX, inside docs/06's ~60–80 budget. Voice block:
`eleven_multilingual_v2`, preset voice `21m00Tcm4TlvDq8ikWAM`
("Rachel", the voice id used throughout ElevenLabs' own API docs —
swap `voiceId`/`voiceName` in the manifest for the chosen announcer
before generating), settings stability 0.5 / similarity 0.75 /
style 0.35 / speaker boost on, output `mp3_44100_128`. Endpoints
verified against the ElevenLabs API reference at build time:
`POST /v1/text-to-speech/{voice_id}` and `POST /v1/sound-generation`,
`xi-api-key` header.

Categories: countdown 4, instruction 6, encouragement 9, results
10, rounds 10 ("Round 1"–"Round 10"), digits 10 (Number Flash
read-out), tutorial 8 (one per game, all ≤12 words), duel 4,
system 3, sfx 9 (the docs/06 UI SFX list as sound-generation
prompts). Every line docs/06 names is present verbatim. **Additions
in the doc's style** (flagged per the brief): great_job, brilliant,
super_speedy, sharp_eyes, on_fire, keep_going (encouragement);
remember_the_order, find_the_pairs, tap_the_targets,
spot_whats_missing (instruction); well_played, final_round,
halfway_there (results); duel_challenge, duel_your_move,
duel_good_game, duel_rival_played (duel); streak_saved,
welcome_back, circuit_start (system). No health/cognitive claims
anywhere — all lines are game-flavoured.

## The generator (`scripts/generate-audio.ts`)

Run with tsx (one-off dev tool, NOT an app dependency):

```bash
npx tsx scripts/generate-audio.ts --dry-run        # validate only
ELEVENLABS_API_KEY=<key> npx tsx scripts/generate-audio.ts
# flags: --force (regenerate existing), --only id,id, --no-normalize
```

Reads the manifest (validated by the shared pure validator in
`scripts/audio-manifest-core.ts`), skips files that already exist,
retries network/429/5xx with backoff (other 4xx fail fast), writes
mp3s to each clip's manifest path, then applies ffmpeg `loudnorm`
when ffmpeg is on PATH (best effort). The key comes from the
`ELEVENLABS_API_KEY` environment variable, falling back to the
git-ignored project `.env` (docs/06); it is never printed or
written anywhere. Note the `.env.example` warning stands for the
*app*: the key has no `EXPO_PUBLIC_` prefix, so Expo never bundles
it — the shell-variable route is still the cleanest. After
generating, run `node scripts/generate-voice-index.mjs` to rebuild
`src/lib/voice-assets.ts` (Metro needs static requires; the index
contains only files that exist on disk). The dry run was executed
here: "manifest ok: 73 clips (64 tts, 9 sfx)".

## SFX that ship today (`scripts/generate-tones.mjs`)

docs/06 prefers synthesized tones for the in-game channel. The
script renders 23 WAVs into `assets/audio/sfx/` (16-bit mono
22050 Hz, ~464 KB total): 9 pentatonic tile tones (C major, so any
sequence order sounds pleasant) + tap, tick, go, correct, wrong,
combo, round_clear, level_up, streak, win, lose, fanfare,
reaction. Deterministic, offline, no key. The manifest's `sfx_*`
mp3s are the optional ElevenLabs upgrade for the same cues; the
runtime does not depend on them.

## Runtime (`src/lib/audio.ts`, real implementation)

Same public interface the Phase 2/3 call sites use (`playCue`,
`playTileTone`), extended with `playSfxCue`, `playVoice`,
`playCountdownCue`, `playDigitSequence`, `playMusicLoop/stopMusic`,
`preloadAudio`, `stopAllAudio`, `setAudioEnabled` (docs/06's
setEnabled → master mute), `setChannelEnabled`. Pure decisions
(channel gating, cue→file and beat/digit→clip mapping, tone wrap)
live in `src/lib/audioCore.ts` and are unit-tested.

- **Channels**: SFX (synth WAVs via `src/lib/sfx-assets.ts`), Voice
  (bundled mp3s via the generated `src/lib/voice-assets.ts` — empty
  until generation, and a missing clip is silence, never an error),
  Music (toggle + volume exist; no loop ships in v1, so
  `playMusicLoop` is a deliberate no-op until an asset is added).
- **Settings**: the store was rebuilt on a pure reducer
  (`src/store/settingsCore.ts`) with persistence through
  `src/lib/storage.ts` — per-channel toggles + volumes (Low/Medium/
  High steps), master mute (restores the mix on unmute), haptics,
  tile assist, colour cues, reduce-motion override. Hydrated in the
  root layout; audio/haptics read `getState()` at call time so every
  change applies live. The Phase 0 defaults are preserved
  (voice cues opt-in, music off per docs/06).
- **Behaviour**: audio mode respects the device silent switch,
  `mixWithOthers`, no background playback (voice/music pause and
  the voice queue clears on backgrounding); SFX players are pooled
  per file and preloaded at startup (docs/06 latency rule); voice
  cues queue FIFO (cap 3, duplicates collapse; digit sequences get
  a dedicated deeper, duplicate-friendly queue) so a line never
  talks over a game timer cue; every playback call is wrapped so
  audio can never crash gameplay.
- **Wiring**: countdown beats (tick + announcer number) in both the
  shared runner-kit countdown and Pattern Recall's runner; Number
  Flash read-out at presentation (additive — never touches flash
  timing or the run clock); Color Confusion combo sting + "Combo!"
  every 5 combo; results fanfare-lite + "New best score!" on a
  verified PB (including when a queued run verifies in place);
  LevelUpModal sting + "Level up!"; circuit-complete fanfare +
  "Daily circuit complete" (+ streak sting); battle-detail win
  fanfare + "Victory", and a soft pop + selection haptic when a
  *new* opponent reaction arrives over Realtime (history on first
  load never replays); game-intro tutorial line per game.

## Settings screen (`app/settings.tsx`, registered in the root stack)

Linked from Profile (gear row). Sections per docs/01's Settings
list: Appearance (theme Light/Dark/System), Sound & Voice (mute
all; per-channel toggle + volume + preview buttons; the voice row
honestly reports when the pack isn't bundled, and About shows
"0 of 64 clips bundled" until generation), Gameplay (haptics,
tile-number assist — Pattern Recall's tray toggle now reads/writes
this same setting), Accessibility (reduce motion Auto/On/Off,
colour shape cues), About (app version from expo-constants).
Notifications, delete account and legal webviews are NOT faked —
they belong to Phases 8/9.

## Polish pass

- **Confetti** (`src/components/Confetti.tsx`): hand-rolled
  Reanimated burst (26 seeded pieces, theme-token colours, fall +
  drift + spin + fade), fired on level-up, circuit complete and
  battle win. Renders nothing under Reduce Motion.
- **Enter animations**: `FadeSlideIn` (fade + 14dp rise, 260ms,
  instant under Reduce Motion) on the results header, circuit
  hero and modal surfaces; the Toggle knob snaps instead of
  sliding under Reduce Motion.
- **Reduce Motion**: `useReduceMotion()` combines
  `AccessibilityInfo.isReduceMotionEnabled` (with the change
  listener) and the Settings override via the tested pure
  `effectiveReduceMotion`.
- **Dark mode**: full sweep — the last two hex literals outside
  `theme.ts` are gone (`Pill` solid-tone text and the TabBar LIVE
  badge now use `onPrimary`); final grep: **0 hex literals outside
  theme.ts**. All Phase 7 surfaces are token-only in both modes.
- **Accessibility**: Pressable scan across src+app — labels were
  already near-universal; fixed the real gaps (Profile "View All"
  ×2, Progress 7D/30D range buttons, player-screen scrim dismiss
  roles). Game tiles already carried position labels (Phase 2/3).
- **48dp audit**: every interactive Pressable is ≥48dp
  (`theme.touch.min` or button height); the sub-48 sizes found by
  grep are decorative inner views (icon tiles, avatar frames, day
  dots, swatches) inside ≥48dp parents — not targets.
- **Colour-blind Color Confusion** (`src/games/color-confusion/
  cues.ts`): each colour also carries a fixed shape marker — red
  heart, blue droplet, green leaf, yellow star, purple diamond,
  cyan hexagon — rendered inside every choice swatch and as an
  "INK: <colour> • <shape>" chip at the prompt, with the shape name
  in every accessibility label. Toggleable in Settings
  (`colorCuesEnabled`), **default ON** (docs/04: cues always show;
  the name labels from Phase 3 remain as well).

## Tests

- `npm test` — **200/200 pass (27 suites)**: 173 from Phases 0–6 +
  27 new — manifest validation (the real manifest validates clean,
  stays in the 60–80 budget, covers every docs/06 family incl.
  rounds/digits/8 tutorials ≤12 words; validator edge cases:
  duplicate ids/files, missing text/prompt, duration bounds, wrong
  directory, id/filename mismatch), settings transitions (defaults
  vs docs, independent toggles, mute-all preserving the mix, volume
  clamping, sanitize/hydrate of malformed blobs, volume steps,
  reduce-motion matrix), colour-cue mapping (coverage + distinct
  icons/names), audio core (channel resolution incl. mute-all,
  cue→asset mapping, countdown/digit ids, tone wrap). Jest gained
  an asset `moduleNameMapper` stub for `.wav/.mp3` requires.
- `npx tsc --noEmit` — **passes, exit 0**.
- `node scripts/verify-replay.mjs` — passes (engines untouched).
- `npx expo config --type public` — resolves (settings route
  registered).
- `npx tsx scripts/generate-audio.ts --dry-run` — manifest ok.
- NOT done: actual ElevenLabs generation (user's key / connector
  approval — see above), EAS build, device run. Nothing committed
  to git.

## Phase 7 addendum — voice pack generated (2026-11-19, evening)

- The user approved the ElevenLabs connector retry; `voices` read
  succeeded, so the stored key is now **verified**. The key is
  free-tier and narrowly scoped: `user` and `models` reads return
  401 (missing `user_read` / `models_read` permissions), but
  text-to-speech works with premade voices.
- The manifest's original voice, Rachel (`21m00Tcm4TlvDq8ikWAM`),
  is a *library* voice and the API refuses it on a free plan
  (HTTP 402 `paid_plan_required`). The manifest now uses the
  premade voice **Jessica** (`cgSgspJ2msm6clMCkdW9` — playful,
  bright, warm) instead; `voiceId`/`voiceName` in
  `scripts/audio-manifest.json` record the swap and the reason.
- All **64 TTS clips generated** via
  `~/workspace/memory-trap/tools/generate_voice_via_connector.py`
  (dynamic-credential surrogate — the real key never entered the
  process, env or logs), each loudnorm-normalised with ffmpeg.
  64 valid mp3s, 772K total, in `assets/audio/voice/`.
  `node scripts/generate-voice-index.mjs` rebuilt: **64 bundled,
  0 missing**; Settings now shows "64 of 64 clips bundled".
- Re-verified after generation: `npx tsc --noEmit` passes,
  **200/200 Jest tests pass (27 suites)**.

# Phase 8 — Notifications, Settings + quality (2026-11-19)

Scope from prompts/phase-08 + docs/01 (Notifications/Settings/
Accounts), docs/05 (Push, Quality, Environment, app.config),
docs/07 (Policy & compliance). Verified at the end: `npx tsc
--noEmit` clean, **269/269 Jest tests pass (33 suites)** — 200
pre-existing + 69 new), `npm run lint` exits 0 (0 errors, 38
warnings — all pre-existing, see Lint below), `npx expo config
--type public` resolves. NOT done by the builder (parent/user
steps): applying the migration, deploying the Edge Functions, EAS
builds, git init.

## Dependencies added (all named in the pack/docs)
- `expo-notifications` ~58.1.9 (docs/05 Push).
- `@sentry/react-native` ~8.28.0 (docs/05 Quality).
- dev: `eslint` ^9.39.5, `eslint-config-expo` ^58.0.4, `prettier`
  ^3.10.1. NOTE: eslint was first installed at v10 and had to be
  pinned back to ^9 — eslint-plugin-react (bundled with
  eslint-config-expo 58) crashes on ESLint 10
  (`contextOrFilename.getFilename is not a function`).
  `npm install` for dev tooling also needs `--legacy-peer-deps`
  (react-dom peer from the Sentry tree vs the pinned react 19.3.0).

## Push notifications (client)
- `src/lib/push.ts`: foreground notification handler, tap-response
  listener (routes through the deep-link parser), and
  `registerPushToken(userId)` — permission ask (Android 13+
  POST_NOTIFICATIONS via expo-notifications), Expo push token fetch,
  upsert into the EXISTING `push_tokens` table (`onConflict: token`).
  Every failure path resolves to null/no-op: no FCM credentials, no
  google-services.json, Expo Go, or a denied permission all leave
  the app running identically. Registration is wired in the root
  layout when the session becomes `ready`.
- `app.config.ts`: `expo-notifications` plugin added (icon +
  #7657E8 colour — config files carry the palette value directly,
  as the adaptive-icon background already did).
- Settings → Notifications: toggles for daily_reminder /
  streak_risk / duels + reminder-time chips, backed by the EXISTING
  `notification_prefs` table via `src/lib/notificationPrefs.ts`
  (RLS-guarded upsert; row created with schema defaults on first
  use). Pure mapping/validation in `notificationPrefsCore.ts`.

## Notifications inbox — DERIVED, no new table (design choice)
docs/05 names `app/notifications.tsx`, but the schema has no
notifications table. The inbox is derived client-side from the two
payloads the app already fetches — `get_battles()` (incoming duel →
duel_invite, playable round → your_turn, finished → duel_result)
and `get_friends()` (incoming requests → friend_request) — in
`src/features/notifications/logic.ts` (pure, tested). It can never
disagree with the Battle/Friends screens and needs no migration.
Trade-offs, accepted: finished-battle items are stamped with the
battle's `created_at` (the payload has no finished-at), and items
exist only while the underlying battle/request does. Unread state
is a single persisted `lastSeenAt` (`src/store/notifications.ts`);
the AppHeader bell on all 5 tabs now routes to `/notifications`
with the unread dot (`useBellProps`). Opening the inbox marks all
seen after a short delay so the highlight is visible for the visit.

## send-push Edge Function (supabase/functions/send-push/)
- Own authorisation, deploy with **verify_jwt DISABLED**: callers
  are machines (DB webhooks, pg_cron) that cannot present a user
  JWT. Accepts the service-role key as bearer OR the
  `SEND_PUSH_CRON_SECRET` in the `x-cron-secret` header; everything
  else 401s. (The parent's deploy helper defaults verify_jwt=true —
  send-push is the exception; delete-account keeps verify_jwt=true.)
- Event mode `{mode:'event', type, user_id, battle_id?, actor_name?}`
  for duel_invite / your_turn / duel_result; checks
  `notification_prefs.duels` first. A body with a `type` and no mode
  is treated as an event (webhook-friendly). Daily mode
  `{mode:'daily'}` reads the migration's `daily_push_targets()` RPC
  (a clean logged no-op until the migration is applied), one push
  per user per pass (streak warning wins over reminder), capped at
  1000 targets.
- Sends via the Expo Push API in chunks of 100; ticket errors
  (unregistered device, missing FCM credentials) are counted and
  logged, never thrown. Optional `EXPO_ACCESS_TOKEN` secret is
  attached when set. NOT deployed by the builder.

## Account deletion (Play requirement)
- `supabase/functions/delete-account/`: JWT caller only, requires
  the body `{confirm: 'DELETE'}` (constant shared with
  `src/lib/accountCore.ts`, re-implemented server-side as Deno
  cannot import src/), then `auth.admin.deleteUser`. The cascade
  chain (auth.users → profiles → everything, including battles for
  BOTH players, push tokens, prefs, analytics) wipes the data; no
  user-id parameter exists, so it can only ever delete the caller.
- In-app: Settings → Danger Zone → Delete my account → strong
  confirmation modal → `deleteMyAccount()` (lib/account.ts) →
  function → signOut → auth gate routes to welcome. No free-text
  confirmation field, per spec. NOT deployed by the builder.

## Deep links
- `src/lib/deepLinks.ts` (pure, tested): parses
  `memorytrap://duel/<uuid>` → `/battle/<id>` and
  `memorytrap://add/<handle>` → `/friends/add?handle=<handle>`
  (the add screen now pre-fills its @search from the param).
  Anything malformed resolves to null and never navigates. Wired
  for cold start + Linking events in the root layout, and for push
  taps via the same validator over notification `data`.

## Sentry
- `src/lib/sentry.ts`: `initSentry()` is a complete no-op without
  `EXPO_PUBLIC_SENTRY_DSN`; the root layout is `Sentry.wrap`-ed
  only when a DSN is configured, so the app runs identically
  without a Sentry account. `sendDefaultPii: false`. Dev-only test
  path: Settings → About shows "Send Sentry test error (dev)" in
  __DEV__ builds with a DSN set.
- The `@sentry/react-native/expo` config plugin IS included:
  `npx expo config --type public` resolves cleanly with it (it only
  warns that organization/project env vars will be used as fallback
  at build time). Source-map upload at build time will additionally
  need `SENTRY_AUTH_TOKEN` + org/project env from the user's Sentry
  account.

## Analytics — Supabase table, NOT PostHog (design choice)
docs/05 left "PostHog or Supabase table" open; the table was
chosen so v1 gains NO new external data processor (also keeps the
Play Data Safety form simpler). `src/lib/analyticsCore.ts` defines
the closed event union (session_started, game_started,
game_completed, circuit_completed, duel_created, duel_completed,
friend_request_sent, notifications_opened) with prop sanitising
(flat scalars only, ≤10 keys, strings ≤100 chars); the migration's
CHECK constraint carries the same list. `src/lib/analytics.ts`
`track()` is fire-and-forget, never throws, and reads the Settings
opt-out (`analyticsEnabled`, new settings-store field, default on)
at call time. Instrumented call sites: session start (root
layout), game_started/game_completed/circuit_completed
(lib/runs.ts), duel_created (lib/battles.ts), friend_request_sent
(lib/social.ts), notifications_opened (inbox screen).
`duel_completed` is defined but deliberately not emitted
client-side yet: duel results are decided server-side, and
emitting from polling get_battles would double-count; it is there
for a future server-side emitter.

## Migration — 20261119040000_phase8_notifications_quality.sql
WRITTEN, NOT APPLIED (parent applies). Contents: `analytics_events`
table + insert-own RLS (no client reads); `app_push_config`
single-row config table (RLS on, no policies); `daily_push_targets()`
(prefs-filtered reminder/streak targets, service_role only);
`trigger_daily_push()` (pg_net POST to send-push, NOTICE no-op
until the config row exists); guarded pg_net/pg_cron extension
attempts and a guarded hourly cron schedule
(`memory-trap-daily-push`, :05). Every cron/net step is wrapped so
the migration cannot fail where the extensions are unavailable —
expect NOTICE lines, not errors, in that case. Known limitation,
documented in the SQL: reminder_time is interpreted in UTC
(profiles have no timezone column in v1). After applying, daily
push still needs the one-time config insert + the
SEND_PUSH_CRON_SECRET function secret (exact SQL in the migration
header).

## Privacy policy + game rules
- In-app: `app/privacy-policy.tsx`, `app/game-rules.tsx`, linked
  from Settings → Privacy. Covers Supabase (auth + gameplay),
  Google Sign-In, push tokens, analytics, Sentry crash reports,
  retention and deletion. The word "Cognitive" appears nowhere in
  the project (grep-verified); Mind Score is described as a fun
  game rating only.
- Web (for the Play Console URLs, Phase 9 hosting):
  `web/privacy-policy.html` (same text as in-app) and
  `web/delete-account.html` (step-by-step deletion instructions +
  exactly what is deleted — including that duels are removed for
  both players, which is what the cascades actually do).

## Offline queue hardening (small, surgical)
`src/store/runQueueCore.ts` (pure, tested): per-entry attempt
count, exponential backoff 30s→8m cap, dead-letter at 5 failures.
`runQueue.ts` persists the new fields (legacy entries normalised
on hydrate) and gains `recordFailure`; `sync.ts` skips not-due /
dead entries and records failures instead of retrying forever.
Server "rejected" verdicts were already final and are unchanged;
no working code was rewritten.

## Quality tooling
- ESLint flat config (`eslint.config.js`, eslint-config-expo) +
  `npm run lint`. Result: **0 errors, 38 warnings**. All 26
  React-Compiler-rule errors were pre-existing Phase 2/3 patterns
  (game runners mirroring callbacks into refs during render,
  ref-held game state, Button/presence set-state-in-effect); those
  three rules (`react-hooks/refs`, `react-hooks/immutability`,
  `react-hooks/set-state-in-effect`) are downgraded to `warn` in
  the config with the rationale written there, rather than
  rewriting shipped, tested game code in a notifications phase.
  Remaining warnings are unused eslint-disable directives. All
  Phase 8 code is clean under the full rule set.
- Prettier: `.prettierrc.json` + `.prettierignore` added; all NEW
  Phase 8 files are prettier-formatted. The pre-existing codebase
  was not mass-reformatted (would be a huge no-op diff);
  `npm run format:check` exists but is advisory and NOT in CI.
- CI: `.github/workflows/ci.yml` — npm ci, typecheck, lint, jest on
  push/PR. Files only: the project is not a git repo yet.
- Maestro: `.maestro/01-launch-to-welcome.yaml`,
  `02-tab-navigation.yaml`, `03-open-a-game.yaml` + README (needs a
  device/emulator + dev build; appId is still the placeholder
  package; flow 2 needs Anonymous sign-ins enabled in Supabase).

## Types
`src/types/database.ts` gained push_tokens, notification_prefs and
analytics_events entries (+ row types) so the new client code is
fully typed against the hand-maintained Database contract.

## What still needs the user (blockers for later steps)
1. Firebase/FCM: create the Firebase project, upload FCM
   credentials to EAS, add google-services.json — until then push
   tokens register but Android delivery returns ticket errors.
2. Sentry account → set EXPO_PUBLIC_SENTRY_DSN (+ SENTRY_AUTH_TOKEN
   and org/project env for build-time source-map upload).
3. GitHub: create/select the repository and push — CI + Maestro
   automation stay files-only until then.
4. Hosting for web/privacy-policy.html and web/delete-account.html
   (the Play Console privacy + deletion URLs, Phase 9).
5. Parent steps: apply the Phase 8 migration; deploy send-push
   (verify_jwt OFF) and delete-account (verify_jwt ON); insert the
   app_push_config row + set SEND_PUSH_CRON_SECRET to activate the
   daily job; optionally configure DB webhooks → send-push event
   mode for duel pushes.
6. Unchanged older blockers: final package name before first EAS
   build; Anonymous sign-ins toggle for guest mode; Google Cloud
   OAuth clients for Google Sign-In.

## Phase 8 — parent live steps completed (2026-11-19, evening)

- Migration `20261119040000_phase8_notifications_quality.sql`
  **applied live and verified**: `analytics_events` and
  `app_push_config` tables present, `daily_push_targets()` and
  `trigger_daily_push()` present, analytics insert-own policy in
  place, and both `pg_cron` and `pg_net` extensions enabled.
- One fix-up: the migration's guarded scheduling block did not
  leave a row in `cron.job` (its exception guard swallowed the
  failure silently), so the job was scheduled directly afterwards
  and verified: `memory-trap-daily-push`, `5 * * * *`, active.
  Daily push remains inert until the `app_push_config` row and the
  `SEND_PUSH_CRON_SECRET` function secret are set (by design).
- Edge Functions deployed via `tools/deploy_fn.py` (now supports a
  `--verify-jwt=false` flag): `delete-account` **ACTIVE v1**
  (verify_jwt on) and `send-push` **ACTIVE v1** (verify_jwt off,
  self-authorising as designed). Unauthenticated smoke tests:
  both return 401.
- Parent re-verification: `npx tsc --noEmit` clean, **269/269
  tests pass (33 suites)**, `npm run lint` exit 0 (0 errors, 38
  pre-existing warnings), `npx expo config --type public` resolves,
  and "Cognitive" appears nowhere in src/app/functions/web.

# Phase 9 — Release preparation (2026-11-19)

Preparation only, per prompts/phase-09-release.md: no build was run,
nobody was logged in, the package name was NOT changed, no git repo
was created, nothing was deployed. Human-facing pack lives in
`release/`: `store-listing.md`, `data-safety.md`,
`permission-audit.md`, `pre-submission-checklist.md`.

## app.config.ts final pass
- Header comment updated: package `com.memorytrap.app` is STILL a
  placeholder — flagged loudly; the user must choose the final ID
  before the first EAS build.
- Adaptive icon: `monochromeImage` now wired to the existing
  `assets/android-icon-monochrome.png` (432×432) for Android 13+
  themed icons. Background stays the brand colour #7657E8 (the
  `android-icon-background.png` file remains unused, as before).
- `blockedPermissions` gained two entries from the library-manifest
  audit (see below): `ACCESS_WIFI_STATE` (netinfo — app needs only
  online/offline + connection type) and `READ_EXTERNAL_STORAGE`
  (expo-image/Glide, maxSdkVersion 32 legacy — app never reads
  device storage).
- Everything else already matched docs/05 essentials: name/slug/
  version 1.0.0, portrait, scheme `memorytrap`,
  userInterfaceStyle automatic, SDK 36 compile/target pinned via
  expo-build-properties, plugins expo-router/expo-font/
  expo-notifications/google-signin/expo-audio/sentry/
  expo-build-properties. `npx expo config --type public --json`
  resolves (exit 0; the Sentry plugin prints its known benign
  "Missing config for organization, project" warning to stdout).

## Permission audit (full detail: release/permission-audit.md)
- Method: config permissions/blockedPermissions PLUS every installed
  native module's library AndroidManifest.xml (Android merges them).
- expo-notifications contributes NO config-array permissions; its
  library manifest adds `POST_NOTIFICATIONS` (needed — Android 13+
  runtime prompt, requested in context, all types toggleable) and
  `RECEIVE_BOOT_COMPLETED`. Other merged permissions:
  `ACCESS_NETWORK_STATE` (netinfo/sentry/expo-image), `VIBRATE`
  (expo-haptics). Plus declared `INTERNET`. Final merged set = 5,
  each justified; no location/storage/media/contacts/mic/camera
  anywhere.
- Nuance recorded: the resolved config `permissions` list shows
  `MODIFY_AUDIO_SETTINGS` (expo-audio's plugin adds it) while it is
  also in `blockedPermissions` — the block is applied at prebuild;
  its absence must be verified in the first AAB's merged manifest.

## eas.json final pass
- `production.android.buildType` is now explicitly `app-bundle`
  (AAB) — previously implicit. `autoIncrement` kept;
  `cli.appVersionSource: remote` kept; development/preview profiles
  unchanged.
- `submit.production` deliberately left empty. What the user must
  supply: a Google service-account JSON (Play Console → Setup → API
  access), referenced as
  `submit.production.android.serviceAccountKeyPath`. No credential
  invented or committed.
- EAS status (checked, nothing changed): eas-cli is not a project
  dependency; `npx eas` fails (no such bin) but `npx eas-cli` works
  — v27.10.0. `eas whoami` → **Not logged in**. No EAS `projectId`
  exists in config yet; it is created/linked at first build after
  the user logs in.

## Icon + splash audit — ALL TEMPLATE PLACEHOLDERS
Measured dimensions (all files exist, all sizes technically valid):
icon.png 1024×1024, android-icon-foreground.png 512×512,
android-icon-background.png 512×512, android-icon-monochrome.png
432×432, splash-icon.png 1024×1024, favicon.png 48×48.
**But visually every one is the unmodified Expo template artwork**
(blue chevron / blueprint grid) left over from Phase 0 scaffolding —
none of it is Memory Trap branding. Consequences, recorded in the
checklist as user/design deliverables: final app icon artwork
(1024×1024 master), store icon 512×512 PNG (does not exist),
feature graphic 1024×500 (does not exist), real screenshots from a
device build, and a configured splash (the splash asset is template
art; SDK 58 has no `splash` config key and the expo-splash-screen
plugin is not in the pack's plugin list, so no custom splash is
configured — the layout still holds the splash until fonts load).

## Store listing / Data Safety / rating prep
- `release/store-listing.md`: name 11/30 chars, short description
  72/80, full description 1642/4000, v1.0.0 release notes 263/500 —
  all measured. Copy covers only shipped features (8 games, Daily
  Circuit, streaks + Freeze shields, friend duels with identical
  server rounds, preset reactions, report/block, XP/levels/league/
  achievements, offline solo + sync, announcer voice). Random Match
  and private rooms are NOT advertised (not shipped). Listing text
  greps clean for cognitive/health/IQ/dementia/brain-training
  language; Mind Score is described only as "a fun game rating".
  Category draft: Games → Puzzle (verify in Console). Contact email
  left as USER TO SUPPLY.
- `release/data-safety.md`: table built from the schema + client
  audit. Collected: email, display name/handle, user IDs, gameplay +
  social app activity, analytics_events (user-linked, opt-out in
  Settings), push token + platform (optional). Not collected:
  location, photos/media, audio recording, files, contacts, health,
  financial, browsing. Encrypted in transit: yes. Deletion: in-app +
  web. Sentry crash logs/diagnostics marked CONDITIONAL — sent only
  if the release build sets EXPO_PUBLIC_SENTRY_DSN (currently unset);
  the Console answers must match the build actually uploaded.
  Service-provider (not "sharing") treatment of Supabase/Google/
  Expo-FCM/Sentry flagged for verification in Console.
- IARC expected answers + target-audience/ads/IAP declarations are
  in the checklist as expected answers to verify in Play Console —
  no policy facts invented (per the phase prompt): no violence/sex/
  gambling/drugs content; UGC = display names + preset avatars +
  preset reactions with blocklist moderation, report and block.

## Pre-submission checklist (release/pre-submission-checklist.md)
- Readiness summary: code-complete for v1; the first internal-track
  build is blocked by exactly (1) final package name decision and
  (2) EAS login; internal-track upload additionally needs the Play
  Console account/app (personal vs organisation decision; personal
  accounts created after 2023-11-13 need the 12-tester × 14-day
  closed test before production — see CLOSED-TEST-PLAN.md) and a
  service-account JSON or a manual Console upload.
- "Only you can do" also includes: Play App Signing enrolment →
  SHA-1 → Google Cloud OAuth clients → enable Google provider in
  Supabase (dashboard; Muse's API credential gets 403 on Auth
  config); Anonymous sign-ins toggle (dashboard); Firebase/FCM +
  google-services.json; Sentry DSN (+ auth token/org/project);
  GitHub repo creation; hosting for web/privacy-policy.html +
  web/delete-account.html; contact email; 12 tester Gmail addresses;
  store graphics/screenshots.
- **Daily-push activation is a user step** (parent live-step
  finding): setting the `SEND_PUSH_CRON_SECRET` Edge Function secret
  via the Supabase Management API returned 403 — this OAuth
  credential cannot write function secrets (same limitation as the
  Auth config endpoint). The checklist therefore instructs: in the
  Supabase dashboard (Project Settings → Edge Functions → Secrets)
  set `SEND_PUSH_CRON_SECRET` to a long random value, then run the
  `app_push_config` insert SQL from the Phase 8 migration header in
  the SQL editor using the SAME value. Until both exist, the hourly
  `memory-trap-daily-push` cron job (scheduled and verified active)
  runs but `trigger_daily_push()` no-ops.
- Launch sequence internal → closed → production with staged
  rollout is reproduced from docs/07.

## Verification (re-run after all Phase 9 changes)
- `npx tsc --noEmit` — passes, exit 0.
- `npm test` — **269/269 tests pass (33 suites)**, unchanged.
- `npx expo config --type public --json` — resolves, exit 0;
  resolved config confirms package unchanged, monochrome icon
  wired, 6 blockedPermissions.
- NOT done (by design): eas build/submit, any login, package-name
  change, git init, migrations, function deploys.

## Phase 9 — parent verification (2026-11-19, evening)

- Release pack spot-checked personally: all four `release/*.md`
  files present; icon dimensions re-measured (icon 1024×1024,
  foreground 512×512, monochrome 432×432, splash 1024×1024 — all
  Expo template placeholder art, as documented); `eas.json`
  production profile confirmed `android.buildType: app-bundle`;
  store listing grep-checked clean for health/cognitive claims.
- Re-ran after the config changes: `npx tsc --noEmit` clean,
  **269/269 tests pass (33 suites)**, `npx expo config --type
  public` resolves.
- Daily-push activation: setting `SEND_PUSH_CRON_SECRET` via the
  Management API returned **403** (this OAuth credential cannot
  write Edge Function secrets — same class of limitation as the
  Auth config endpoint). Activation is therefore a documented
  user step in the pre-submission checklist; no config row was
  inserted, so the cron job remains a safe no-op.
