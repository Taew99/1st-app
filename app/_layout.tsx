import 'react-native-url-polyfill/auto';
import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthListener } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RootLayoutNav() {
  useAuthListener();
  const { session, isLoading } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [session, isLoading]);

  useEffect(() => {
    if (session) {
      registerForPushNotificationsAsync();
    }
  }, [session]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="post/create"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="post/quote"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="vault/create"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="vault/edit/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="question/today"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="question/categories"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
