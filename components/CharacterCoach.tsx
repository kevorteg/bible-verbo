import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import CharacterSprite from './CharacterSprite';
import { Character, CharacterReaction, CharacterSize } from '../services/characterData';
import { useTheme } from '../contexts/ThemeContext';

interface CharacterCoachProps {
  character: Character;
  message: string;
  reaction?: CharacterReaction;
  size?: CharacterSize;
  side?: 'left' | 'right';
  onPressCharacter?: () => void;
  bubbleColor?: string;
}

export function CharacterCoach({
  character,
  message,
  reaction = 'happy',
  size = 'lg',
  side = 'left',
  onPressCharacter,
  bubbleColor,
}: CharacterCoachProps) {
  const { colors } = useTheme();
  const bg = bubbleColor || colors.surfaceLowest;
  const isLeft = side === 'left';

  const Bubble = (
    <View style={{ flex: 1, position: 'relative' }}>
      <View
        style={{
          backgroundColor: bg,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: colors.surfaceHigh,
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface, lineHeight: 21 }}>
          {message}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          top: 22,
          [isLeft ? 'left' : 'right']: -9,
          width: 16,
          height: 16,
          backgroundColor: bg,
          borderLeftWidth: 2,
          borderBottomWidth: 2,
          borderColor: colors.surfaceHigh,
          transform: [{ rotate: isLeft ? '45deg' : '-135deg' }],
        }}
      />
    </View>
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{ flexDirection: isLeft ? 'row' : 'row-reverse', alignItems: 'flex-start', gap: 14 }}
    >
      <CharacterSprite character={character} size={size} reaction={reaction} onPress={onPressCharacter} />
      {Bubble}
    </Animated.View>
  );
}
