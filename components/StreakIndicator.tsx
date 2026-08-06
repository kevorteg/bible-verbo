import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface StreakIndicatorProps {
  streakDays: number;
  multiplier: number;
  compact?: boolean;
}

export function StreakIndicator({ streakDays, multiplier, compact }: StreakIndicatorProps) {
  const { colors } = useTheme();

  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Flame size={16} color={multiplier >= 3 ? '#FF4444' : multiplier >= 2 ? '#FF8800' : multiplier >= 1.5 ? colors.tertiary : colors.onSurfaceVariant} />
        <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>{streakDays}</Text>
        {multiplier > 1 && (
          <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: colors.tertiary }}>x{multiplier}</Text>
        )}
      </View>
    );
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayOffset = i;
    return {
      label: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][dayOffset],
      active: i < Math.min(streakDays, 7),
    };
  });

  return (
    <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Flame size={24} color={multiplier >= 3 ? '#FF4444' : multiplier >= 2 ? '#FF8800' : multiplier >= 1.5 ? colors.tertiary : colors.onSurfaceVariant} />
          <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{streakDays}</Text>
        </View>
        {multiplier > 1 && (
          <View style={{ backgroundColor: colors.tertiaryContainer, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onTertiary }}>x{multiplier} XP</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {days.map((d, i) => (
          <View
            key={i}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, backgroundColor: d.active ? colors.primary : colors.surfaceHigh }}
          >
            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: d.active ? colors.onPrimary : colors.onSurfaceVariant }}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
