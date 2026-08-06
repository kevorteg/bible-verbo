import { View, Text, Pressable } from 'react-native';
import { Flame, Gem, Heart } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface GamificationHeaderProps {
  streakDays: number;
  coins: number;
  lives?: number;
  maxLives?: number;
  onPressStreak?: () => void;
  onPressCoins?: () => void;
  onPressLives?: () => void;
}

interface StatPillProps {
  icon: React.ReactNode;
  value: string | number;
  color: string;
  onPress?: () => void;
}

function StatPill({ icon, value, color, onPress }: StatPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 6 }}
    >
      {icon}
      <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans_700Bold', color }}>{value}</Text>
    </Pressable>
  );
}

export function GamificationHeader({
  streakDays,
  coins,
  lives = 5,
  maxLives = 5,
  onPressStreak,
  onPressCoins,
  onPressLives,
}: GamificationHeaderProps) {
  const { colors } = useTheme();
  const streakActive = streakDays > 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <StatPill
        icon={<Flame size={26} color={streakActive ? '#FF9600' : colors.onSurfaceVariant} fill={streakActive ? '#FF9600' : 'transparent'} />}
        value={streakDays}
        color={streakActive ? '#FF9600' : colors.onSurfaceVariant}
        onPress={onPressStreak}
      />
      <StatPill
        icon={<Gem size={24} color="#1CB0F6" fill="#9FDCFF" />}
        value={coins}
        color="#1CB0F6"
        onPress={onPressCoins}
      />
      <StatPill
        icon={<Heart size={24} color="#FF4B4B" fill="#FF4B4B" />}
        value={`${lives}`}
        color="#FF4B4B"
        onPress={onPressLives}
      />
    </View>
  );
}
