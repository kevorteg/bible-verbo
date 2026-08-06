import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Users, BarChart3 } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

const adminOptions = [
  { icon: Users, label: 'Gestionar Usuarios', color: null },
  { icon: Shield, label: 'Moderacion', color: null },
  { icon: BarChart3, label: 'Estadisticas', color: null },
];

export default function AdminScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Admin</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
        {adminOptions.map((opt) => (
          <Pressable
            key={opt.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <opt.icon size={24} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}>{opt.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
