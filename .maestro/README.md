# Maestro smoke flows (Phase 8)

Three smoke flows: launch → welcome, guest sign-in → tab
navigation, and opening a game. They are **files only** until run
against a real build — Maestro cannot run in this repo's CI (it
needs a device/emulator with the app installed).

## To run them

1. Build and install a **development build** (not Expo Go — the app
   uses native modules Expo Go lacks):
   `eas build -p android --profile development`, then install the
   APK on an emulator or device.
2. Install Maestro: https://docs.maestro.dev (CLI + `maestro test`).
3. From the project root:
   - `maestro test .maestro/01-launch-to-welcome.yaml`
   - `maestro test .maestro/02-tab-navigation.yaml`
   - `maestro test .maestro/03-open-a-game.yaml`

## Caveats

- `appId` is the placeholder package `com.memorytrap.app` — update
  it in each flow when the final package name is decided (Phase 9).
- Flow 2 needs **Anonymous sign-ins enabled** in the Supabase
  dashboard for "Play as guest" to succeed, and the profile-setup
  step may need a human tap the first time (the flow marks it
  optional).
- Selectors are visible-text based (the app's accessibility labels),
  so copy changes in the welcome/tab screens may need flow updates.
