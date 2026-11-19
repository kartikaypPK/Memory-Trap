import type { ExpoConfig } from 'expo/config';

// Memory Trap — config, final pass Phase 9 (release preparation).
// PACKAGE NAME IS FINAL: com.memorytrap.app — decided by the user on
// 2026-11-19 ("Keep com.memorytrap.app as the final package name").
// It cannot change after publishing; do not rename it.
const config: ExpoConfig = {
  name: 'Memory Trap',
  slug: 'memory-trap',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'memorytrap',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'com.memorytrap.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      // Phase 9: wire the themed (monochrome) icon asset that already
      // exists in assets/ — Android 13+ themed icons use it.
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#7657E8',
    },
    // Minimal permissions. No storage / location / mic / camera / contacts.
    // Full audit with per-permission justification:
    // release/permission-audit.md. Library manifests merge a few more
    // (POST_NOTIFICATIONS + RECEIVE_BOOT_COMPLETED from expo-notifications,
    // ACCESS_NETWORK_STATE, VIBRATE) — all justified in the audit; the
    // unneeded library permissions are stripped via blockedPermissions.
    permissions: ['android.permission.INTERNET'],
    blockedPermissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      // Phase 9: netinfo's library manifest adds ACCESS_WIFI_STATE — the
      // app only needs online/offline + connection type (sync queue), never
      // Wi-Fi details.
      'android.permission.ACCESS_WIFI_STATE',
      // Phase 9: expo-image's Glide manifest adds READ_EXTERNAL_STORAGE
      // (maxSdkVersion 32 legacy) — the app never reads device storage;
      // all images are bundled assets or network URLs.
      'android.permission.READ_EXTERNAL_STORAGE',
    ],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    // Phase 8: push notifications (docs/05). The plugin adds the
    // Android notification machinery; actual delivery also needs FCM
    // credentials in EAS + google-services.json, which are user
    // steps (see BUILD-NOTES Phase 8). The app no-ops gracefully
    // without them (src/lib/push.ts).
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#7657E8',
      },
    ],
    // Phase 8: Sentry crash reporting. The plugin only wires the
    // native build steps; at runtime everything is guarded by
    // EXPO_PUBLIC_SENTRY_DSN (src/lib/sentry.ts). Source-map upload
    // additionally needs SENTRY_AUTH_TOKEN + org/project env at
    // build time — absent those, builds still succeed and simply
    // skip the upload.
    '@sentry/react-native/expo',
    // Phase 1: native Google Sign-In (needs a development build, not Expo
    // Go). The sign-in code also needs EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and
    // the Google provider enabled in Supabase — see BUILD-NOTES.md.
    '@react-native-google-signin/google-signin',
    // Playback only (docs/06): no recording, no background audio — this
    // stops the expo-audio plugin adding RECORD_AUDIO / foreground-service
    // permissions. The app only plays bundled ElevenLabs clips.
    [
      'expo-audio',
      {
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundPlayback: false,
        enableBackgroundRecording: false,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          // Google Play requires new apps to target API 36 (Android 16)
          // since 31 Aug 2026. Pin explicitly — do not rely on SDK defaults.
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: '36.0.0',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  // EAS project: @prashantkartikay123/memory-trap (created 2026-11-19;
  // account chosen by the user). Added by hand because EAS cannot write
  // to a dynamic TypeScript config.
  owner: 'prashantkartikay123',
  extra: {
    eas: {
      projectId: 'caea156b-b3cc-4a56-9ebc-d02b5361a014',
    },
  },
};

export default config;
