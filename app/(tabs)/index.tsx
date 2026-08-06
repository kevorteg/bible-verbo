import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { BookOpen, BrainCircuit, Flame, Star, MapPin, Heart, CheckCircle2, Lock, Zap, Trophy, Cross, Gift, TrendingUp, Sun, Target, Users, Flag } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../hooks/useGamification';
import { useCharacter } from '../../contexts/CharacterContext';
import { StreakIndicator } from '../../components/StreakIndicator';
import { Toast } from '../../components/Toast';
import { fetchDailyDevotional, DailyDevotional } from '../../services/dailyDevotional';
import { getRecentScores, TriviaScore } from '../../services/triviaService';

const featureCards: { icon: any; label: string; route: Href }[] = [
  { icon: Cross, label: 'Sermones', route: '/(tabs)/sermones' },
  { icon: BookOpen, label: 'VerboCast', route: '/verbocast' },
  { icon: BrainCircuit, label: 'Trivias', route: '/games' },
  { icon: MapPin, label: 'Mapa Iglesias', route: '/map' },
];

const journeyMilestones = [1, 10, 25, 50, 100, 150, 200, 300, 500, 750, 1000];

const green = '#2E7D32';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const {
    data, loading, level, xpForNext, xpProgress, streakMultiplier, doClaimDailyReward,
    league, canOpenChestNow, doOpenChest,
  } = useGamification();

  const [claiming, setClaiming] = useState(false);
  const [chestOpening, setChestOpening] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' | 'levelup' }>({ visible: false, message: '', type: 'info' });
  const [devotional, setDevotional] = useState<DailyDevotional | null>(null);
  const [recentTrivias, setRecentTrivias] = useState<TriviaScore[]>([]);
  const { activeCharacter, triggerCelebration } = useCharacter();
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    fetchDailyDevotional().then(setDevotional);
    getRecentScores(5).then(setRecentTrivias);
  }, []);

  const today = new Date().toDateString();
  const alreadyClaimed = data.lastDailyRewardDate === today;

  const claimDaily = useCallback(async () => {
    if (claiming || alreadyClaimed) return;
    setClaiming(true);
    try {
      const result = await doClaimDailyReward();
      if (result) {
        confettiRef.current?.start();
        setToast({ visible: true, message: result.message, type: 'success' });
      } else {
        setToast({ visible: true, message: 'Ya reclamaste hoy', type: 'info' });
      }
    } catch {
      setToast({ visible: true, message: 'Error al reclamar', type: 'error' });
    } finally {
      setClaiming(false);
    }
  }, [claiming, alreadyClaimed, doClaimDailyReward]);

  const handleOpenChest = useCallback(async () => {
    if (chestOpening || !canOpenChestNow) return;
    setChestOpening(true);
    const result = await doOpenChest();
    if (result) {
      confettiRef.current?.start();
      setToast({ visible: true, message: `Cofre abierto! Recibiste: ${result.reward}`, type: 'success' });
    }
    setChestOpening(false);
  }, [chestOpening, canOpenChestNow, doOpenChest]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BookOpen size={28} color={colors.primary} />
            <Text style={{ fontSize: 28, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Verbo</Text>
          </View>
          {user && (
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 16, color: colors.onPrimary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{
            backgroundColor: colors.surfaceLowest,
            borderRadius: 16,
            padding: 20,
            shadowColor: 'rgba(0,0,0,0.08)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
                  Nivel {level}
                </Text>
                <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>
                  {user?.name || 'Bienvenido'}
                </Text>
              </View>
              <Pressable onPress={() => triggerCelebration()}>
                <Image
                  source={activeCharacter.asset}
                  style={{ width: 56, height: 56, borderRadius: 16 }}
                  resizeMode="cover"
                />
              </Pressable>
            </View>

            <View style={{ height: 10, backgroundColor: colors.surfaceHigh, borderRadius: 5, overflow: 'hidden', marginBottom: 4 }}>
              <View style={{
                width: `${xpProgress * 100}%`,
                height: '100%',
                backgroundColor: colors.primary,
                borderRadius: 5,
              }} />
            </View>
            <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'right' }}>
              {data.xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 10 }}>
                <Flame size={20} color={colors.tertiary} />
                <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{data.streakDays}</Text>
                <Text style={{ fontSize: 9, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Racha</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 10 }}>
                <BookOpen size={20} color={colors.primary} />
                <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{data.chaptersRead}</Text>
                <Text style={{ fontSize: 9, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Capitulos</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 10 }}>
                <Zap size={20} color={colors.tertiary} />
                <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{data.coins}</Text>
                <Text style={{ fontSize: 9, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Monedas</Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/(tabs)/biblia')}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 16,
                shadowColor: colors.primaryShadow,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>
                Leer la Biblia
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <StreakIndicator streakDays={data.streakDays} multiplier={streakMultiplier} />
        </View>

        {!alreadyClaimed && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <Pressable
              onPress={claimDaily}
              disabled={claiming}
              style={{
                backgroundColor: colors.tertiary,
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                shadowColor: 'rgba(0,0,0,0.08)',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 8,
              }}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Gift size={24} color={'#fff'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' }}>
                  Recompensa diaria
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: 'rgba(255,255,255,0.8)' }}>
                  Reclama tus monedas y XP!
                </Text>
              </View>
              <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: '#fff' }}>{'>'}</Text>
            </Pressable>
          </View>
        )}

        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.push('/collective-goals' as any)}
            style={{
              backgroundColor: colors.surfaceLowest,
              borderRadius: 16,
              padding: 16,
              shadowColor: 'rgba(0,0,0,0.06)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              <Target size={22} color={'#fff'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>Metas Colectivas</Text>
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Lectura en grupo con logros compartidos</Text>
            </View>
            <Text style={{ fontSize: 16, color: colors.primary, fontFamily: 'BricolageGrotesque' }}>{'>'}</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.push('/groups' as any)}
            style={{
              backgroundColor: colors.surfaceLowest,
              borderRadius: 16,
              padding: 16,
              shadowColor: 'rgba(0,0,0,0.06)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.tertiary, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              <Users size={22} color={'#fff'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>Grupos y Retos</Text>
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Unete a tu grupo y completa retos de lectura</Text>
            </View>
            <Flag size={16} color={colors.tertiary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Pressable
            onPress={() => devotional ? router.push({ pathname: '/reader', params: { book: devotional.book, chapter: devotional.chapter } }) : router.push('/(tabs)/biblia')}
            style={{
              backgroundColor: colors.surfaceLowest,
              borderRadius: 16,
              padding: 20,
              shadowColor: 'rgba(0,0,0,0.08)',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.tertiary,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 4,
              }}>
                <Sun size={22} color={'#fff'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>
                  Devocional del dia
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>
                  {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
              <Text style={{ fontSize: 16, color: colors.tertiary, fontFamily: 'BricolageGrotesque' }}>{'>'}</Text>
            </View>
            <View style={{
              backgroundColor: colors.surfaceHigh,
              borderRadius: 12,
              padding: 14,
            }}>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurface, lineHeight: 20 }}>
                {devotional ? devotional.text : 'Cargando...'}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginTop: 6 }}>
                {devotional ? devotional.reference : ''}
              </Text>
            </View>
          </Pressable>
        </View>

        {league && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <View style={{
              backgroundColor: colors.surfaceLowest,
              borderRadius: 16,
              padding: 16,
              shadowColor: 'rgba(0,0,0,0.06)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 4,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Trophy size={18} color={colors.primary} />
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>
                    Liga {league.league}
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>
                    #{league.playerRank}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push('/(tabs)/profile')}
                  style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.surfaceHigh }}
                >
                  <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurfaceVariant }}>
                    Ver mas
                  </Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {league.entries.slice(0, 3).map((entry, idx) => (
                  <View key={idx} style={{
                    flex: 1,
                    alignItems: 'center',
                    backgroundColor: entry.isPlayer ? colors.primaryContainer : colors.surfaceHigh,
                    borderRadius: 12,
                    padding: 10,
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontFamily: 'BricolageGrotesque',
                      color: idx === 0 ? colors.tertiary : colors.onSurfaceVariant,
                    }}>
                      {['#1', '#2', '#3'][idx]}
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      color: entry.isPlayer ? colors.primary : colors.onSurface,
                      marginTop: 4,
                    }} numberOfLines={1}>
                      {entry.isPlayer ? 'Tu' : entry.name}
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginTop: 2 }}>
                      {entry.xp} XP
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {canOpenChestNow && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <Pressable
              onPress={handleOpenChest}
              disabled={chestOpening}
              style={{
                backgroundColor: colors.tertiary,
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                opacity: chestOpening ? 0.7 : 1,
                shadowColor: colors.tertiary + '80',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 1,
                shadowRadius: 0,
                elevation: 6,
              }}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Gift size={22} color='#fff' />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' }}>
                  Cofre de Bendicion
                </Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: 'rgba(255,255,255,0.8)' }}>
                  7+ dias de racha! Abre tu cofre
                </Text>
              </View>
              <Text style={{ fontSize: 20, color: '#fff', fontFamily: 'BricolageGrotesque' }}>{'>'}</Text>
            </Pressable>
          </View>
        )}

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Mapa de Progreso
          </Text>
          <View style={{
            backgroundColor: colors.surfaceLowest,
            borderRadius: 16,
            padding: 20,
            shadowColor: 'rgba(0,0,0,0.08)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 0, alignItems: 'center' }}>
              {journeyMilestones.map((milestone, i) => {
                const isLast = i === journeyMilestones.length - 1;
                const isCompleted = data.chaptersRead >= milestone;
                const isCurrent = !isCompleted && (i === 0 || data.chaptersRead >= journeyMilestones[i - 1]);
                const nodeSize = isCurrent ? 56 : 44;
                return (
                  <View key={milestone} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ alignItems: 'center' }}>
                      <View
                        style={{
                          width: nodeSize,
                          height: nodeSize,
                          borderRadius: nodeSize / 2,
                          backgroundColor: isCompleted ? green : isCurrent ? colors.tertiary : colors.surfaceHigh,
                          alignItems: 'center', justifyContent: 'center',
                          shadowColor: isCurrent ? colors.tertiaryShadow : 'rgba(0,0,0,0.1)',
                          shadowOffset: { width: 0, height: isCurrent ? 6 : 4 },
                          shadowOpacity: 1, shadowRadius: 0,
                          elevation: isCurrent ? 8 : 4,
                          borderWidth: isCurrent ? 3 : 0,
                          borderColor: isCurrent ? colors.tertiary : 'transparent',
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={nodeSize * 0.5} color="#FFFFFF" />
                        ) : isCurrent ? (
                          <Star size={nodeSize * 0.45} color={colors.onTertiary} fill={colors.onTertiary} />
                        ) : (
                          <Lock size={nodeSize * 0.4} color={colors.onSurfaceVariant} />
                        )}
                      </View>
                      <Text style={{ fontSize: 8, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>{milestone} cap.</Text>
                    </View>
                    {!isLast && (
                      <View style={{ width: 24, height: 3, backgroundColor: isCompleted ? green : colors.surfaceHigh, borderRadius: 2 }} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Explorar
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {featureCards.map((f) => (
              <Pressable
                key={f.label}
                onPress={() => router.push(f.route)}
                style={{
                  width: '46%',
                  backgroundColor: colors.surfaceLowest,
                  borderRadius: 16,
                  padding: 20,
                  alignItems: 'center',
                  shadowColor: 'rgba(0,0,0,0.08)',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  elevation: 8,
                }}
              >
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: colors.surfaceLow,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <f.icon size={28} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface, textAlign: 'center' }}>{f.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: 100 }}>
          <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Trivias Recientes
          </Text>
          <View style={{
            backgroundColor: colors.surfaceLowest,
            borderRadius: 16,
            padding: recentTrivias.length > 0 ? 16 : 24,
            shadowColor: 'rgba(0,0,0,0.08)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 8,
          }}>
            {recentTrivias.length === 0 ? (
              <Pressable onPress={() => router.push('/games')} style={{ alignItems: 'center' }}>
                <BrainCircuit size={48} color={colors.onSurfaceVariant} />
                <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                  No hay trivias aun
                </Text>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
                  Toca para jugar ahora
                </Text>
              </Pressable>
            ) : (
              recentTrivias.map((t, i) => {
                const pct = t.total > 0 ? Math.round((t.score / t.total) * 100) : 0;
                const dateStr = new Date(t.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
                return (
                  <Pressable
                    key={i}
                    onPress={() => router.push('/games')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < recentTrivias.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceHigh }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: pct >= 80 ? green + '20' : pct >= 50 ? colors.tertiary + '20' : colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' }}>
                      <BrainCircuit size={18} color={pct >= 80 ? green : pct >= 50 ? colors.tertiary : colors.onSurfaceVariant} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }} numberOfLines={1}>{t.title}</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{t.score}/{t.total} correctas - {dateStr}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 14, fontFamily: 'BricolageGrotesque', color: pct >= 80 ? green : pct >= 50 ? colors.tertiary : colors.onSurfaceVariant }}>{pct}%</Text>
                      <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh, overflow: 'hidden', marginTop: 2 }}>
                        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: pct >= 80 ? green : pct >= 50 ? colors.tertiary : colors.onSurfaceVariant, borderRadius: 2 }} />
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
      <ConfettiCannon ref={confettiRef} count={50} origin={{ x: 200, y: 0 }} fadeOut autoStart={false} />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}
