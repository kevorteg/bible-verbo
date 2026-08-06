import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface StreakIndicatorProps {
  streakDays: number;
  multiplier: number;
  compact?: boolean;
}

const FIRE = '#FF9600';
const FIRE_EDGE = '#E08600';

export function StreakIndicator({ streakDays, multiplier, compact }: StreakIndicatorProps) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Flame size={16} color={streakDays > 0 ? FIRE : colors.onSurfaceVariant} fill={streakDays > 0 ? FIRE : 'transparent'} />
        <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: streakDays > 0 ? FIRE : colors.onSurfaceVariant }}>{streakDays}</Text>
        {multiplier > 1 && (
          <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', color: FIRE }}>x{multiplier}</Text>
        )}
      </View>
    );
  }

  const days = Array.from({ length: 7 }, (_, i) => ({
    label: ['L', 'M', 'M', 'J', 'V', 'S', 'D'][i],
    active: i < Math.min(streakDays, 7),
  }));

  return (
    <View
      style={{
        backgroundColor: colors.surfaceLowest,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.surfaceHigh,
        padding: 18,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: streakDays > 0 ? '#FFF0DB' : colors.surfaceLow,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Flame size={32} color={streakDays > 0 ? FIRE : colors.onSurfaceVariant} fill={streakDays > 0 ? FIRE : 'transparent'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 30, fontFamily: 'BricolageGrotesque', color: colors.onSurface, lineHeight: 34 }}>
            {streakDays}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurfaceVariant }}>
            {streakDays === 1 ? 'dia de racha' : 'dias de racha'}
          </Text>
        </View>
        {multiplier > 1 && (
          <View
            style={{
              backgroundColor: FIRE,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderBottomWidth: 3,
              borderBottomColor: FIRE_EDGE,
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF' }}>x{multiplier} XP</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {days.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurfaceVariant }}>{d.label}</Text>
            <View
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.active ? '#FFF0DB' : colors.surfaceLow,
                borderWidth: 2,
                borderColor: d.active ? FIRE : colors.surfaceHigh,
              }}
            >
              <Flame size={16} color={d.active ? FIRE : colors.surfaceHigh} fill={d.active ? FIRE : 'transparent'} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
