import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import { BookOpen, Flame, Coins, Star, Sun, Moon, Library, BrainCircuit, MapPin, Heart, Shield, Users, Mic, LogOut, Award, Headphones, Map as MapIcon, Settings, Bookmark, MessageCircle, Send, ChevronDown, ChevronUp, Gift, TrendingUp, Trophy } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useAuth } from '../../contexts/AuthContext';
import { useAchievements } from '../../hooks/useAchievements';
import { useGamification } from '../../hooks/useGamification';
import { useCharacter } from '../../contexts/CharacterContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../hooks/useChat';
import { Toast } from '../../components/Toast';
import { biblicalAvatars, getAvatarById } from '../../services/avatarData';
import { getFavorites } from '../../services/favoritesService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADMIN_EMAIL = 'milife.ortega2000@gmail.com';

function calcLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function calcXpForNextLevel(level: number) {
  return level * level * 100;
}

const themeIcons: Record<string, any> = {
  light: Sun,
  dark: Moon,
  sepia: Library,
};

const themeLabels: Record<string, string> = {
  light: 'Claro',
  dark: 'Oscuro',
  sepia: 'Sepia',
};

const extraLinks: { icon: any; label: string; route: Href }[] = [
  { icon: Mic, label: 'VerboCast', route: '/verbocast' },
  { icon: BrainCircuit, label: 'Juegos / Trivia', route: '/games' },
  { icon: Coins, label: 'Tienda', route: '/store' },
  { icon: MapPin, label: 'Mapa Iglesias', route: '/map' },
  { icon: Heart, label: 'Muro de Oracion', route: '/prayer-wall' },
  { icon: Headphones, label: 'Audio Biblia', route: '/audio-bible' },
  { icon: MapIcon, label: 'Mapa de Progreso', route: '/(tabs)' },
  { icon: Bookmark, label: 'Favoritos', route: '/(tabs)' },
  { icon: Users, label: 'Lideres', route: '/leader-tools' },
];

const linkColors: string[] = ['#449BD1', '#473458', '#F58634', '#F58634', '#e74c3c', '#449BD1', '#2E7D32', '#E8A0C8', '#473458'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { achievements } = useAchievements();
  const { data: gamData, league, canOpenChestNow, doOpenChest } = useGamification();
  const { theme, toggleTheme, colors } = useTheme();
  const { activeCharacter, selectCharacter, triggerCelebration, randomCharacter } = useCharacter();
  const { chatMessages, isTyping, sendMessage } = useChat(null);
  const confettiRef = useRef<ConfettiCannon>(null);
  const [avatarId, setAvatarId] = useState('david');
  const [favCount, setFavCount] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; type: 'success' | 'info' | 'levelup'; title: string; message: string }>({ visible: false, type: 'success', title: '', message: '' });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const closeToast = () => setToast(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    AsyncStorage.getItem('verbo_avatar').then(saved => {
      if (saved) setAvatarId(saved);
    });
    getFavorites().then(list => setFavCount(list.length));
    AsyncStorage.getItem('verbo_notifications_enabled').then(val => {
      if (val !== null) setNotificationsEnabled(val === 'true');
    });
  }, []);

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('verbo_notifications_enabled', value ? 'true' : 'false');
    const { cancelAllNotifications, scheduleReadingReminders, scheduleChurchReminders } = await import('../../services/notificationService');
    if (value) {
      const { requestNotificationPermissions } = await import('../../services/notificationService');
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleReadingReminders();
        await scheduleChurchReminders();
      }
    } else {
      await cancelAllNotifications();
    }
  };

  const avatar = getAvatarById(avatarId);

  const stats = user?.stats || { chaptersRead: 0, notesCount: 0, streakDays: 0, lastActivityDate: '' };
  const level = calcLevel(gamData.xp);
  const xpNeeded = calcXpForNextLevel(level);
  const prevLevelXp = (level - 1) * (level - 1) * 100;
  const xpProgress = Math.min((gamData.xp - prevLevelXp) / ((xpNeeded - prevLevelXp) || 1), 1);
  const ThemeIcon = themeIcons[theme];
  const isAdmin = user?.email === ADMIN_EMAIL || user?.role === 'admin';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BookOpen size={28} color={colors.primary} />
            <Text style={{ fontSize: 28, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Verbo</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Pressable onPress={toggleTheme} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryContainer }}>
              <ThemeIcon size={18} color={colors.primary} />
            </Pressable>
            <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: avatar?.color || colors.primary }}>
              {avatar ? (
                <Text style={{ fontSize: 14, fontFamily: 'BricolageGrotesque', color: '#FFFFFF' }}>{avatar.icon}</Text>
              ) : (
                <Text style={{ fontSize: 14, color: colors.onPrimary, fontFamily: 'PlusJakartaSans_700Bold' }}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8, borderWidth: 6, borderColor: colors.surfaceLowest, marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onPrimary, textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase' }}>Level</Text>
              <Text style={{ fontSize: 36, fontFamily: 'BricolageGrotesque', color: colors.onPrimary, textAlign: 'center' }}>{level}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{user?.name || 'Invitado'}</Text>
          <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{xpNeeded - gamData.xp > 0 ? `${xpNeeded - gamData.xp} XP para nivel ${level + 1}` : 'Nivel maximo!'}</Text>
          <View style={{ width: '70%', height: 20, backgroundColor: colors.surfaceHighest, borderRadius: 10, marginTop: 8, overflow: 'hidden', borderWidth: 2, borderColor: colors.surfaceHigh }}>
            <View style={{ width: `${xpProgress * 100}%`, height: '100%', backgroundColor: colors.secondary, borderRadius: 10 }} />
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginTop: 4 }}>{gamData.xp} XP total</Text>
          <Pressable
            onPress={() => router.push('/edit-profile')}
            style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surfaceLow }}
          >
            <Settings size={16} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Configuracion</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Pressable
            onPress={randomCharacter}
            style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
          >
            <Image
              source={activeCharacter.asset}
              style={{ width: 48, height: 48, borderRadius: 12 }}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>{activeCharacter.name}</Text>
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{activeCharacter.description}</Text>
            </View>
            <Text style={{ fontSize: 11, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Toca para cambiar</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flex: 1, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
              <Flame size={28} color={colors.primary} />
              <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{gamData.streakDays}</Text>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Racha</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
              <BookOpen size={28} color={colors.secondary} />
              <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{gamData.chaptersRead}</Text>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Capitulos</Text>
            </View>
          </View>
          <View style={{ marginTop: 16, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
            <Coins size={28} color={colors.tertiary} />
            <Text style={{ fontSize: 22, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{gamData.coins.toLocaleString()}</Text>
            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Verbo Coins</Text>
          </View>
          {canOpenChestNow && (
            <Pressable
              onPress={async () => {
                const result = await doOpenChest();
                if (result) {
                  confettiRef.current?.start();
                  setToast({ visible: true, type: 'success', title: 'Cofre de Bendicion!', message: `Recibiste: ${result.reward}` });
                }
              }}
              style={{ marginTop: 12, backgroundColor: colors.tertiary, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: colors.tertiary + '80', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={22} color='#fff' />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' }}>Cofre de Bendicion</Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: 'rgba(255,255,255,0.8)' }}>Tienes 7+ dias de racha! Abre tu cofre</Text>
              </View>
              <Text style={{ fontSize: 20, color: '#fff', fontFamily: 'BricolageGrotesque' }}>{'>'}</Text>
            </Pressable>
          )}
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          {league && (
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={22} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>Liga {league.league}</Text>
                    <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>
                      Puesto #{league.playerRank} de {league.entries.length}
                    </Text>
                  </View>
                </View>
                <View style={{ width: 50, height: 50, borderRadius: 12, backgroundColor: colors.tertiary + '20', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={24} color={colors.tertiary} />
                </View>
              </View>
              <View style={{ gap: 4 }}>
                {league.entries.slice(0, 3).map((entry, idx) => (
                  <View key={idx} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: entry.isPlayer ? colors.primaryContainer : 'transparent',
                    borderRadius: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 8,
                  }}>
                    <Text style={{
                      width: 24,
                      fontSize: 14,
                      fontFamily: 'BricolageGrotesque',
                      color: idx === 0 ? colors.tertiary : colors.onSurfaceVariant,
                      textAlign: 'center',
                    }}>
                      {['#1', '#2', '#3'][idx]}
                    </Text>
                    <Text style={{
                      flex: 1,
                      fontSize: 13,
                      fontFamily: 'PlusJakartaSans',
                      color: entry.isPlayer ? colors.primary : colors.onSurface,
                    }}>
                      {entry.isPlayer ? 'Tu' : entry.name}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>
                      {entry.xp} XP
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <Pressable
            onPress={() => setChatOpen(!chatOpen)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
          >
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>Verbo IA</Text>
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Pregunta lo que quieras sobre la Biblia</Text>
            </View>
            {chatOpen ? <ChevronUp size={20} color={colors.onSurfaceVariant} /> : <ChevronDown size={20} color={colors.onSurfaceVariant} />}
          </Pressable>

          {chatOpen && (
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              <View style={{ maxHeight: 240 }}>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {chatMessages.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <MessageCircle size={32} color={colors.outlineVariant} />
                      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>Preguntame algo sobre la Biblia</Text>
                    </View>
                  )}
                  {chatMessages.slice(-5).map((msg) => (
                    <View
                      key={msg.id}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        backgroundColor: msg.role === 'user' ? colors.primary : colors.surfaceHigh,
                        borderRadius: 16,
                        padding: 12,
                        marginBottom: 8,
                        borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                        borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: msg.role === 'user' ? colors.onPrimary : colors.onSurface }}>
                        {msg.text}
                      </Text>
                    </View>
                  ))}
                  {isTyping && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: colors.surfaceHigh, borderRadius: 16, padding: 12, marginBottom: 8, borderBottomLeftRadius: 4 }}>
                      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Escribiendo...</Text>
                    </View>
                  )}
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 8 }}>
                {['Romanos 8:28', 'Versiculo del dia', 'Devocional', 'Juan 3:16'].map((qr) => (
                  <Pressable
                    key={qr}
                    style={{ backgroundColor: colors.surfaceLow, borderRadius: 24, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.outlineVariant }}
                    onPress={() => setChatInput(qr)}
                  >
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}>{qr}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  style={{ flex: 1, height: 40, backgroundColor: colors.surfaceLow, borderRadius: 20, paddingHorizontal: 14, fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
                  placeholder="Escribe un mensaje..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={() => {
                    if (chatInput.trim() && !isTyping) {
                      sendMessage(chatInput.trim());
                      setChatInput('');
                    }
                  }}
                  returnKeyType="send"
                />
                <Pressable
                  onPress={() => {
                    if (chatInput.trim() && !isTyping) {
                      sendMessage(chatInput.trim());
                      setChatInput('');
                    }
                  }}
                  disabled={isTyping}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isTyping ? colors.surfaceHigh : colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
                >
                  <Send size={18} color={isTyping ? colors.onSurfaceVariant : colors.onPrimary} />
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Funciones</Text>
          {extraLinks.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={22} color={linkColors[i]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}>{item.label}</Text>
                {item.label === 'Favoritos' && favCount > 0 && (
                  <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>{favCount} versiculos guardados</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {isAdmin && (
          <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Admin</Text>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}>Panel de Administracion</Text>
            </Pressable>
          </View>
        )}

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Logros</Text>
            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.secondary }}>{achievements.length} desbloqueados</Text>
          </View>
          {achievements.length === 0 ? (
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              <Award size={48} color={colors.outlineVariant} />
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurfaceVariant, marginTop: 8 }}>Aun no hay logros</Text>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>Sigue leyendo para desbloquear logros</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {achievements.map((ach) => (
                <View key={ach.id} style={{ alignItems: 'center', gap: 8, width: '30%' }}>
                  <View style={{ width: 60, height: 60, borderRadius: 16, backgroundColor: colors.tertiaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: colors.tertiaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}>
                    <Star size={24} color={colors.onTertiary} fill={colors.onTertiary} />
                  </View>
                  <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, textAlign: 'center' }}>{ach.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Notificaciones</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>Recordatorios</Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Lectura diaria y cultos</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.surfaceHigh, true: colors.primary + '80' }}
              thumbColor={notificationsEnabled ? colors.primary : colors.onSurfaceVariant}
            />
          </View>
        </View>

        {user && (
          <View style={{ paddingHorizontal: 24, marginBottom: 100 }}>
            <Pressable
              onPress={logout}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surfaceHigh, borderRadius: 16, padding: 16 }}
            >
              <LogOut size={20} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurfaceVariant }}>Cerrar Sesion</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
      <ConfettiCannon ref={confettiRef} count={50} origin={{ x: 200, y: -100 }} fadeOut autoStart={false} />
      <Toast visible={toast.visible} type={toast.type} title={toast.title} message={toast.message} onDismiss={closeToast} />
    </SafeAreaView>
  );
}
