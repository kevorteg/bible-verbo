import { useEffect, useRef } from 'react';
import { View, Text, Animated, Pressable } from 'react-native';
import { X, CheckCircle2, Award, Flame, Star, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

type ToastType = 'success' | 'achievement' | 'streak' | 'levelup' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  type: ToastType;
  title: string;
  message: string;
  onDismiss: () => void;
  duration?: number;
}

const icons = {
  success: CheckCircle2,
  achievement: Award,
  streak: Flame,
  levelup: Star,
  info: CheckCircle2,
  warning: AlertTriangle,
};

const typeColors = {
  success: '#2E7D32',
  achievement: '#F58634',
  streak: '#FF4444',
  levelup: '#449BD1',
  info: '#473458',
  warning: '#E53935',
};

export function Toast({ visible, type, title, message, onDismiss, duration = 3000 }: ToastProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const Icon = icons[type];
  const accentColor = typeColors[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 200 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <Pressable
        onPress={hide}
        style={{
          backgroundColor: '#473458',
          borderRadius: 16,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
          shadowColor: '#473458',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 0,
          elevation: 12,
        }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: accentColor + '30', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={'#FFF'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF' }}>{title}</Text>
          <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: '#DDDDDD' }}>{message}</Text>
        </View>
        <Pressable onPress={hide} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <X size={14} color={'#FFFFFF'} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
