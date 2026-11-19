# Memory Trap — Project Context (read this first, every session)

Casual mobile memory-games app. 8 mini-games, daily challenge, streaks, friend duels (async), leaderboards.
First release: **Android (Google Play)**. Keep code iOS-safe, but do not spend time on iOS-only work.

## Stack (fixed — do not substitute)
- React Native + Expo (latest stable SDK), TypeScript strict, **Expo Router** (file-based)
- Supabase: Auth, Postgres (+RLS), Realtime, Storage, Edge Functions (Deno/TS)
- ElevenLabs: **audio is pre-generated offline** and bundled/stored; never called from the app at runtime
- State: Zustand (UI/session) + TanStack Query (server data). Offline cache: MMKV (or AsyncStorage)
- Animation: react-native-reanimated + gesture-handler. Haptics: expo-haptics. Audio: expo-audio
- Icons: @expo/vector-icons (MaterialIcons / MaterialCommunityIcons — designs use Material Symbols)
- Fonts: @expo-google-fonts/plus-jakarta-sans (titles, numbers), @expo-google-fonts/inter (body/UI)
- Builds: EAS Build (development build, not Expo Go — Google Sign-In needs native code), EAS Submit

## Source of truth
- `designs/*.png` = visual target; `designs/*.html` = layout/copy reference only (it is web/Tailwind — never port the HTML, rebuild in RN)
- `designs/DESIGN.md` + `docs/02-DESIGN-SYSTEM.md` + `src-reference/theme.ts` = tokens. Never hardcode colors/sizes in components.
- `docs/` = product, game rules, architecture. `supabase/` = schema. If docs conflict with a screenshot, the doc wins and flag it.

## Hard rules
1. Every color/spacing/radius/font comes from the theme; every screen works in Light, Dark, and System.
2. Touch targets >= 48x48dp. Primary buttons 52px high, pill, solid bottom "lip" that collapses on press.
3. Numbers (scores, timers, XP) use Plus Jakarta Sans with tabular numerals.
4. Scores are **never trusted from the client**. Games are deterministic from a server-issued seed; the client submits an input log; an Edge Function recomputes and writes the score.
5. All DB access goes through RLS-protected tables or Edge Functions. Never ship the service-role key in the app. Only `EXPO_PUBLIC_SUPABASE_URL` and anon key in the client.
6. No free-text chat, ever. Social = preset reactions only. Report + block reachable in <=1 tap from any profile.
7. Copy: this is a **game**, not a health product. Never claim to improve, diagnose or measure cognitive health/IQ/dementia risk. Use "Mind Score" as a fun game rating. (Play policy risk.)
8. Offline-first for solo play: games run offline, runs are queued and synced when online ("Cached locally • Syncs on connect").
9. Accessibility: tile shapes always have icon + label (not color alone), reduce-motion respected, sound/haptics toggles.
10. Small, reviewable commits; after each feature run `npx tsc --noEmit` and lint, and test on an Android emulator/device.

## Working agreement
- Build in the phase order in `docs/01-PRD.md` and `prompts/`. Do one phase per session, stop and summarize.
- Ask before adding any dependency not listed above.
- Put game logic in pure TS modules under `src/games/<game>/engine.ts` (no React) with unit tests, UI in `ui.tsx`.
