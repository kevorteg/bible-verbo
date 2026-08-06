import { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Coins, Snowflake, Shield, Zap, Gift, CheckCircle2, Star, Timer, BookOpen, Heart } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../contexts/ThemeContext';
import { useGamification } from '../hooks/useGamification';
import { Toast } from '../components/Toast';

const PURPLE_SHADOW = '#473458';
const CARD_RADIUS = 16;

type ToastState = {
  visible: boolean;
  type: 'success' | 'info' | 'levelup';
  title: string;
  message: string;
};

const powerUps = [
  {
    id: 'freeze',
    icon: Snowflake,
    name: 'Congelar Racha',
    description: 'Protege tu racha por 1 dia si no lees',
    cost: 200,
    color: '#449BD1',
    iconName: 'ac_unit',
  },
  {
    id: 'potenciador',
    icon: Zap,
    name: 'Potenciador x2',
    description: 'Duplica el XP ganado por 30 minutos',
    cost: 100,
    color: '#2E7D32',
    iconName: 'rocket_launch',
  },
  {
    id: 'repair',
    icon: Shield,
    name: 'Reparar Racha',
    description: 'Recupera tu racha actual (1 vez al mes)',
    cost: 500,
    color: '#F58634',
    iconName: 'auto_awesome',
  },
];

const dailyDeals = [
  {
    id: 'wisdom',
    icon: BookOpen,
    name: 'Wisdom Pack',
    description: '50 XP + 30 monedas',
    cost: 800,
    color: '#449BD1',
    bgColor: '#74c6ff',
  },
  {
    id: 'timewarp',
    icon: Timer,
    name: 'Time Warp',
    description: 'Extiende potenciador a 60 min',
    cost: 1200,
    color: '#6b567c',
    bgColor: '#d6bde9',
  },
  {
    id: 'superstreak',
    icon: Heart,
    name: 'Super Streak',
    description: 'Salva racha automaticamente',
    cost: 500,
    color: '#F58634',
    bgColor: '#f2dfd5',
  },
];

export default function StoreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const confettiRef = useRef<ConfettiCannon>(null);
  const {
    data, doBuyFreeze, doBuyPotenciador, doRepairStreak,
    doClaimDailyReward, canRepair,
  } = useGamification();
  const [toast, setToast] = useState<ToastState>({
    visible: false, type: 'success', title: '', message: '',
  });
  const [claimed, setClaimed] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  const showToast = (type: ToastState['type'], title: string, message: string) => {
    setToast({ visible: true, type, title, message });
  };

  const closeToast = () => setToast(prev => ({ ...prev, visible: false }));

  const handleClaimDaily = useCallback(async () => {
    if (claimed) return;
    const result = await doClaimDailyReward();
    if (result.coins > 0) {
      setClaimed(true);
      showToast('success', 'Recompensa diaria!', `+${result.coins} monedas y +${result.xp} XP`);
      confettiRef.current?.start();
    } else {
      showToast('info', 'Ya reclamaste hoy', 'Vuelve manana para tu recompensa');
    }
  }, [claimed, doClaimDailyReward]);

  const handleBuy = useCallback(async (itemId: string) => {
    const item = powerUps.find(i => i.id === itemId);
    if (!item) return;

    if (data.coins < item.cost) {
      showToast('info', 'Monedas insuficientes', `Te faltan ${item.cost - data.coins} monedas`);
      return;
    }

    if (itemId === 'freeze') {
      await doBuyFreeze();
    } else if (itemId === 'potenciador') {
      await doBuyPotenciador();
    } else if (itemId === 'repair') {
      if (!canRepair) {
        showToast('info', 'Ya usaste reparacion este mes', 'Vuelve el mes que viene');
        return;
      }
      await doRepairStreak();
    }

    showToast('success', 'Compra exitosa!', `${item.name} adquirido`);
    confettiRef.current?.start();
  }, [data.coins, canRepair, doBuyFreeze, doBuyPotenciador, doRepairStreak]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ConfettiCannon
        ref={confettiRef}
        count={40}
        origin={{ x: 200, y: -20 }}
        autoStart={false}
        fadeOut
        colors={['#449BD1', '#2E7D32', '#F58634', '#FFD700']}
      />

      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onDismiss={closeToast}
        duration={2500}
      />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceLow,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: PURPLE_SHADOW,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 0,
              elevation: 4,
            }}
          >
            <Coins size={20} color={colors.primary} />
          </Pressable>
          <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.primary, fontWeight: '800' }}>
            Verbo
          </Text>
        </View>

        {/* Coin Counter Pill */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.surfaceContainerHigh,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderBottomWidth: 4,
          borderBottomColor: colors.outlineVariant,
        }}>
          <Coins size={18} color={colors.tertiary} fill={colors.tertiary} />
          <Text style={{
            fontSize: 16,
            fontFamily: 'SpaceGrotesk',
            color: colors.onSurface,
            fontWeight: '700',
          }}>
            {data.coins.toLocaleString()}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Daily Deals Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <Text style={{
              fontSize: 22,
              fontFamily: 'BricolageGrotesque',
              color: colors.onSurface,
            }}>
              Daily Deals
            </Text>
            <Text style={{
              fontSize: 12,
              fontFamily: 'SpaceGrotesk',
              color: colors.secondary,
              fontWeight: '700',
              textTransform: 'uppercase',
            }}>
              Termina en 14h 22m
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={220}
            decelerationRate='fast'
            contentContainerStyle={{ gap: 14, paddingRight: 20 }}
          >
            {/* Daily Reward Deal */}
            <Pressable
              onPress={handleClaimDaily}
              disabled={claimed}
              style={{
                width: 200,
                backgroundColor: '#74c6ff',
                borderRadius: CARD_RADIUS,
                padding: 20,
                borderWidth: 2,
                borderColor: '#004b6f',
                shadowColor: PURPLE_SHADOW,
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 8,
                opacity: claimed ? 0.7 : 1,
              }}
            >
              <View style={{ width: 80, height: 80, alignSelf: 'center', marginBottom: 12, alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={48} color={claimed ? colors.onSurfaceVariant : '#FFF'} />
              </View>
              <Text style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_700Bold',
                color: '#001e2f',
                textAlign: 'center',
                marginBottom: 4,
              }}>
                {claimed ? 'Reclamado' : 'Recompensa Diaria'}
              </Text>
              {!claimed && (
                <View style={{
                  alignSelf: 'center',
                  backgroundColor: '#001e2f',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Coins size={12} color='#FFF' />
                  <Text style={{ fontSize: 12, color: '#FFF', fontFamily: 'SpaceGrotesk', fontWeight: '700' }}>
                    +{20 + Math.min(data.streakDays, 30) * 2}
                  </Text>
                </View>
              )}
            </Pressable>

            {dailyDeals.map((deal) => {
              const DealIcon = deal.icon;
              return (
                <Pressable
                  key={deal.id}
                  style={{
                    width: 200,
                    backgroundColor: deal.bgColor,
                    borderRadius: CARD_RADIUS,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: deal.color,
                    shadowColor: PURPLE_SHADOW,
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 8,
                  }}
                >
                  <View style={{ width: 80, height: 80, alignSelf: 'center', marginBottom: 12, alignItems: 'center', justifyContent: 'center' }}>
                    <DealIcon size={44} color={deal.color} />
                  </View>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: colors.onSurface,
                    textAlign: 'center',
                    marginBottom: 4,
                  }}>
                    {deal.name}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    fontFamily: 'PlusJakartaSans',
                    color: colors.onSurfaceVariant,
                    textAlign: 'center',
                    marginBottom: 8,
                  }}>
                    {deal.description}
                  </Text>
                  <View style={{
                    alignSelf: 'center',
                    backgroundColor: colors.onSurface,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 999,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <Coins size={12} color='#FFF' />
                    <Text style={{ fontSize: 12, color: '#FFF', fontFamily: 'SpaceGrotesk', fontWeight: '700' }}>
                      {deal.cost}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Power-ups Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{
            fontSize: 22,
            fontFamily: 'BricolageGrotesque',
            color: colors.onSurface,
            marginBottom: 16,
          }}>
            Power-ups
          </Text>

          {powerUps.map((item) => {
            const Icon = item.icon;
            const canAfford = data.coins >= item.cost;
            const isRepair = item.id === 'repair';
            const isDisabled = isRepair && !canRepair;

            return (
              <Pressable
                key={item.id}
                onPress={() => handleBuy(item.id)}
                disabled={isDisabled}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  backgroundColor: colors.surfaceContainer,
                  borderRadius: CARD_RADIUS,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 2,
                  borderColor: colors.outlineVariant,
                  shadowColor: PURPLE_SHADOW,
                  shadowOffset: { width: 4, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  elevation: 6,
                  opacity: isDisabled ? 0.5 : 1,
                }}
              >
                <View style={{
                  width: 60,
                  height: 60,
                  backgroundColor: '#FFF',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.outlineVariant + '50',
                }}>
                  <Icon size={30} color={item.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: colors.onSurface,
                  }}>
                    {item.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans',
                    color: colors.onSurfaceVariant,
                    marginTop: 2,
                  }}>
                    {item.description}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleBuy(item.id)}
                  disabled={isDisabled}
                  style={{
                    backgroundColor: isRepair && !canRepair ? colors.surfaceHigh : colors.primaryContainer,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: 'center',
                    shadowColor: '#733500',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 0,
                    elevation: 6,
                    minWidth: 80,
                  }}
                >
                  <Text style={{
                    fontSize: 10,
                    fontFamily: 'SpaceGrotesk',
                    color: isRepair && !canRepair ? colors.onSurfaceVariant : colors.onPrimaryContainer,
                    textTransform: 'uppercase',
                    opacity: 0.7,
                  }}>
                    {isRepair && !canRepair ? 'Agotado' : 'Comprar'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Coins size={12} color={isRepair && !canRepair ? colors.onSurfaceVariant : colors.onPrimaryContainer} />
                    <Text style={{
                      fontSize: 14,
                      fontFamily: 'SpaceGrotesk',
                      fontWeight: '700',
                      color: isRepair && !canRepair ? colors.onSurfaceVariant : colors.onPrimaryContainer,
                    }}>
                      {item.cost}
                    </Text>
                  </View>
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* Inventory */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{
            backgroundColor: colors.surfaceContainer,
            borderRadius: CARD_RADIUS,
            padding: 16,
            borderWidth: 2,
            borderColor: colors.outlineVariant,
            shadowColor: PURPLE_SHADOW,
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 6,
          }}>
            <Text style={{
              fontSize: 12,
              fontFamily: 'SpaceGrotesk',
              color: colors.primary,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 12,
              fontWeight: '700',
            }}>
              Inventario
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{
                flex: 1,
                alignItems: 'center',
                backgroundColor: '#FFF',
                borderRadius: 12,
                padding: 12,
                borderWidth: 2,
                borderColor: colors.outlineVariant + '30',
              }}>
                <Snowflake size={24} color='#449BD1' />
                <Text style={{
                  fontSize: 20,
                  fontFamily: 'BricolageGrotesque',
                  color: colors.onSurface,
                  marginTop: 4,
                }}>
                  {data.inventory.freeze}
                </Text>
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'SpaceGrotesk',
                  color: colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}>
                  Freezes
                </Text>
              </View>
              <View style={{
                flex: 1,
                alignItems: 'center',
                backgroundColor: '#FFF',
                borderRadius: 12,
                padding: 12,
                borderWidth: 2,
                borderColor: colors.outlineVariant + '30',
              }}>
                <Zap size={24} color='#2E7D32' />
                <Text style={{
                  fontSize: 20,
                  fontFamily: 'BricolageGrotesque',
                  color: colors.onSurface,
                  marginTop: 4,
                }}>
                  {data.inventory.potenciador}
                </Text>
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'SpaceGrotesk',
                  color: colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}>
                  Potenciadores
                </Text>
              </View>
              <View style={{
                flex: 1,
                alignItems: 'center',
                backgroundColor: '#FFF',
                borderRadius: 12,
                padding: 12,
                borderWidth: 2,
                borderColor: colors.outlineVariant + '30',
              }}>
                <Shield size={24} color='#F58634' />
                <Text style={{
                  fontSize: 20,
                  fontFamily: 'BricolageGrotesque',
                  color: colors.onSurface,
                  marginTop: 4,
                }}>
                  {data.repairUsedThisMonth ? '0' : '1'}
                </Text>
                <Text style={{
                  fontSize: 10,
                  fontFamily: 'SpaceGrotesk',
                  color: colors.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}>
                  Reparaciones
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
