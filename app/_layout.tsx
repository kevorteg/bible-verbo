import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { View, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';

import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { CharacterProvider } from '../contexts/CharacterContext';
import { requestNotificationPermissions, scheduleReadingReminders, scheduleChurchReminders, cancelAllNotifications } from '../services/notificationService';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque: BricolageGrotesque_800ExtraBold,
    PlusJakartaSans: PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold: PlusJakartaSans_700Bold,
    SpaceGrotesk: SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider>
          <CharacterProvider>
            <AppContent />
          </CharacterProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    try {
      const Notifications = require('expo-notifications');
      if (Notifications.setNotificationHandler) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    const setupNotifications = async () => {
      const enabled = await AsyncStorage.getItem('verbo_notifications_enabled');
      if (enabled === 'false') return;
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleReadingReminders();
        await scheduleChurchReminders();
      }
    };
    setupNotifications();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={colors.onSurface === '#FFE8DC' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reader" options={{ presentation: 'card' }} />
        <Stack.Screen name="verbocast" options={{ presentation: 'card' }} />
        <Stack.Screen name="games" options={{ presentation: 'card' }} />
        <Stack.Screen name="map" options={{ presentation: 'card' }} />
        <Stack.Screen name="prayer-wall" options={{ presentation: 'card' }} />
        <Stack.Screen name="leader-tools" options={{ presentation: 'card' }} />
        <Stack.Screen name="admin/index" options={{ presentation: 'card' }} />
        <Stack.Screen name="audio-bible" options={{ presentation: 'card' }} />
        <Stack.Screen name="sermon-player" options={{ presentation: 'card' }} />
        <Stack.Screen name="store" options={{ presentation: 'card' }} />
        <Stack.Screen name="collective-goals" options={{ presentation: 'card' }} />
        <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
        <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="auth/register" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}
