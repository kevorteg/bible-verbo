import { View, Text, Pressable } from 'react-native';
import { Check, Star, Lock } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LearningPathProps {
  milestones: number[];
  progress: number;
  onPressNode?: (milestone: number) => void;
}

const OFFSETS = [0, 48, 72, 48, 0, -48, -72, -48];

export function LearningPath({ milestones, progress, onPressNode }: LearningPathProps) {
  const { colors } = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      {milestones.map((milestone, i) => {
        const isCompleted = progress >= milestone;
        const isCurrent = !isCompleted && (i === 0 || progress >= milestones[i - 1]);
        const isLocked = !isCompleted && !isCurrent;
        const offset = OFFSETS[i % OFFSETS.length];

        const faceColor = isCompleted ? colors.primary : isCurrent ? colors.tertiary : colors.surfaceHigh;
        const edgeColor = isCompleted ? colors.primaryShadow : isCurrent ? colors.tertiaryShadow : colors.surfaceHighest;
        const nodeSize = isCurrent ? 76 : 64;

        return (
          <View key={milestone} style={{ alignItems: 'center', transform: [{ translateX: offset }] }}>
            <Pressable
              onPress={() => onPressNode?.(milestone)}
              style={({ pressed }) => ({
                width: nodeSize,
                height: nodeSize,
                borderRadius: nodeSize / 2,
                backgroundColor: edgeColor,
                paddingBottom: pressed ? 0 : 6,
                alignItems: 'center',
                justifyContent: 'flex-start',
              })}
            >
              {({ pressed }) => (
                <View
                  style={{
                    width: '100%',
                    height: nodeSize - 6,
                    borderRadius: nodeSize / 2,
                    backgroundColor: faceColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ translateY: pressed ? 6 : 0 }],
                  }}
                >
                  {isCompleted ? (
                    <Check size={nodeSize * 0.42} color="#FFFFFF" strokeWidth={3.5} />
                  ) : isCurrent ? (
                    <Star size={nodeSize * 0.42} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Lock size={nodeSize * 0.36} color={colors.onSurfaceVariant} />
                  )}
                </View>
              )}
            </Pressable>
            <View
              style={{
                marginTop: 8,
                marginBottom: 16,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: isLocked ? colors.surfaceLow : isCompleted ? colors.primaryContainer : colors.tertiaryContainer,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'PlusJakartaSans_700Bold',
                  color: isLocked ? colors.onSurfaceVariant : isCompleted ? colors.onPrimaryContainer : colors.onTertiaryContainer,
                }}
              >
                {milestone} cap.
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
