import { useState, ReactNode } from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle, GestureResponderEvent } from 'react-native';

type DuoButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'neutral';
type DuoButtonSize = 'sm' | 'md' | 'lg';

interface DuoButtonProps {
  label?: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: DuoButtonVariant;
  size?: DuoButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: ReactNode;
  faceColor?: string;
  edgeColor?: string;
  labelColor?: string;
}

const VARIANTS: Record<DuoButtonVariant, { face: string; edge: string; label: string }> = {
  primary: { face: '#58CC02', edge: '#58A700', label: '#FFFFFF' },
  secondary: { face: '#1CB0F6', edge: '#1899D6', label: '#FFFFFF' },
  tertiary: { face: '#FF9600', edge: '#E08600', label: '#FFFFFF' },
  neutral: { face: '#FFFFFF', edge: '#E5E5E5', label: '#3C3C3C' },
};

const SIZES: Record<DuoButtonSize, { padV: number; padH: number; font: number; edge: number; radius: number }> = {
  sm: { padV: 8, padH: 16, font: 13, edge: 3, radius: 14 },
  md: { padV: 14, padH: 22, font: 16, edge: 4, radius: 16 },
  lg: { padV: 18, padH: 28, font: 18, edge: 5, radius: 18 },
};

export function DuoButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  fullWidth,
  style,
  textStyle,
  children,
  faceColor,
  edgeColor,
  labelColor,
}: DuoButtonProps) {
  const [pressed, setPressed] = useState(false);
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const face = faceColor || v.face;
  const edge = edgeColor || v.edge;
  const label_ = labelColor || v.label;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      style={[
        {
          borderRadius: s.radius,
          backgroundColor: edge,
          paddingBottom: pressed ? 0 : s.edge,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: face,
          borderRadius: s.radius,
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          transform: [{ translateY: pressed ? s.edge : 0 }],
        }}
      >
        {icon}
        {children}
        {label ? (
          <Text
            style={[
              {
                fontSize: s.font,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: label_,
                letterSpacing: 0.5,
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
