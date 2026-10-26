import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NikonyuProvider } from '@/state/nikonyu-store';

SplashScreen.preventAutoHideAsync();

// 試作のうちは明るい配色だけに固定する（Web版でサーバー描画と色がずれるのも防ぐ）
export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <NikonyuProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
      </NikonyuProvider>
    </ThemeProvider>
  );
}
