import { Image, View } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import { Character, CharacterReaction, CharacterSize } from '../services/characterData';

const SIZES: Record<CharacterSize, number> = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 180,
};

interface CharacterSpriteProps {
  character: Character;
  size?: CharacterSize;
  reaction?: CharacterReaction;
  customSize?: number;
  onPress?: () => void;
}

const REACTION_ANIMATIONS: Record<CharacterReaction, { scale: number; rotate: string }> = {
  idle: { scale: 1, rotate: '0deg' },
  happy: { scale: 1.05, rotate: '0deg' },
  celebrate: { scale: 1.15, rotate: '0deg' },
  encourage: { scale: 1.03, rotate: '0deg' },
  thinking: { scale: 0.98, rotate: '0deg' },
  sad: { scale: 0.95, rotate: '0deg' },
  surprised: { scale: 1.1, rotate: '0deg' },
};

export default function CharacterSprite({ character, size = 'md', reaction = 'idle', customSize, onPress }: CharacterSpriteProps) {
  const dim = customSize || SIZES[size];

  const animStyle = useAnimatedStyle(() => {
    const anim = REACTION_ANIMATIONS[reaction];
    if (reaction === 'celebrate') {
      return {
        transform: [
          { scale: withRepeat(withSequence(withTiming(1.15, { duration: 300 }), withTiming(1, { duration: 300 })), 3, true) },
        ],
      };
    }

    return {
      transform: [{ scale: withTiming(anim.scale, { duration: 300, easing: Easing.elastic(1) }) }],
    };
  }, [reaction]);

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(200)}
      style={[animStyle, { width: dim, height: dim }]}
    >
      <Image
        source={character.asset}
        style={{ width: dim, height: dim, borderRadius: dim / 2 }}
        resizeMode="cover"
      />
    </Animated.View>
  );
}
