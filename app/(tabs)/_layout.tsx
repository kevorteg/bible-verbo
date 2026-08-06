import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { BookOpen, MessageCircle, User, Home, Video, BookMarked } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { theme, colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            height: 60,
            backgroundColor: colors.surfaceLowest,
            borderRadius: 32,
            borderTopWidth: 0,
            shadowColor: theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
            paddingHorizontal: 8,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          tabBarLabelStyle: {
            fontFamily: 'SpaceGrotesk',
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="biblia"
          options={{
            title: 'Biblia',
            tabBarIcon: ({ color, size }) => (
              <BookOpen size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="devociones"
          options={{
            title: 'Devociones',
            tabBarIcon: ({ color, size }) => (
              <BookMarked size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sermones"
          options={{
            title: 'Sermones',
            tabBarIcon: ({ color, size }) => (
              <Video size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}
