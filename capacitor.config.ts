import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jarvis.app',
  appName: 'J.A.R.V.I.S.',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
