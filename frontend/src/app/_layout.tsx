import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AlarmListener } from '@/components/alarm-listener';
import { FocusOverlay } from '@/components/focus-overlay';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Onboarding } from '@/components/onboarding';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const ONBOARDED_KEY = 'sealo.onboarded';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // null = 플래그 로딩 중 (스플래시 유지)
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((v) => setOnboarded(v === 'true'))
      .catch(() => setOnboarded(true)); // 저장소 오류 시 앱 진입은 막지 않음
  }, []);

  const completeOnboarding = () => {
    setOnboarded(true);
    AsyncStorage.setItem(ONBOARDED_KEY, 'true').catch(() => {});
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {onboarded === false ? <Onboarding onStart={completeOnboarding} /> : null}
        {onboarded === true ? (
          <>
            <AppTabs />
            <AlarmListener />
            <FocusOverlay />
          </>
        ) : null}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
