import { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, RefreshControl, Alert, Modal, KeyboardAvoidingView, Platform as RNPlatform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Send, Eye, EyeOff, ChevronDown, Filter, Church, CheckCircle2, Plus } from 'lucide-react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Toast } from '../components/Toast';
import { fetchPrayers, createPrayer, prayForRequest } from '../services/prayerService';
import { loadGamification, saveGamification } from '../services/gamificationStorage';
import { checkAchievements } from '../services/gamificationEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES = ['Todas', 'Salud', 'Estudios', 'Espiritual', 'Familia', 'Otros'] as const;
const CATEGORY_COLORS: Record<string, string> = {
  Salud: '#e74c3c',
  Estudios: '#449BD1',
  Espiritual: '#473458',
  Familia: '#2E7D32',
  Otros: '#F58634',
};

const PRAYER_XP_KEY = 'verbo_prayer_xp_tracker';
const MAX_DAILY_PRAYER_XP = 20;
const PRAYER_CREATE_XP = 5;
const PRAYER_CREATE_COINS = 2;
const PRAY_ACTION_XP = 2;

type ToastState = {
  visible: boolean;
  type: 'success' | 'info' | 'levelup';
  title: string;
  message: string;
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ayer';
  if (diffD < 7) return `hace ${diffD}d`;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export default function PrayerWallScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const confettiRef = useRef<ConfettiCannon>(null);

  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'success', title: '', message: '' });
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());

  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Otros');
  const [formAnonymous, setFormAnonymous] = useState(false);
  const [formTestimony, setFormTestimony] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const showToast = (type: ToastState['type'], title: string, message: string) => {
    setToast({ visible: true, type, title, message });
  };

  const closeToast = () => setToast(prev => ({ ...prev, visible: false }));

  const loadPrayers = useCallback(async () => {
    try {
      const data = await fetchPrayers();
      setPrayers(data);
    } catch {
      showToast('info', 'Sin conexion', 'Usando datos locales');
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadPrayers();
  }, [loadPrayers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPrayers();
  }, [loadPrayers]);

  const filteredPrayers = activeCategory === 'Todas'
    ? prayers
    : prayers.filter(p => p.category === activeCategory);

  const awardPrayerXp = useCallback(async (amount: number, coinsAmount: number, type: 'create' | 'pray') => {
    const gam = await loadGamification();
    gam.xp += amount;
    gam.coins += coinsAmount;
    if (type === 'create') gam.prayersCreated += 1;
    if (type === 'pray') gam.prayersForOthers += 1;
    const { newAchievements, totalCoinReward } = checkAchievements(gam);
    gam.coins += totalCoinReward;
    const newLevel = Math.floor(Math.sqrt(gam.xp / 100)) + 1;
    const leveledUp = newLevel > gam.level;
    gam.level = newLevel;
    await saveGamification(gam);
    return { newAchievements, leveledUp, totalCoinReward };
  }, []);

  const checkDailyPrayerXp = useCallback(async (): Promise<number> => {
    try {
      const raw = await AsyncStorage.getItem(PRAYER_XP_KEY);
      if (raw) {
        const tracker = JSON.parse(raw);
        const today = new Date().toDateString();
        if (tracker.date === today) return tracker.xp || 0;
      }
    } catch {}
    return 0;
  }, []);

  const addDailyPrayerXp = useCallback(async (amount: number) => {
    try {
      const today = new Date().toDateString();
      const raw = await AsyncStorage.getItem(PRAYER_XP_KEY);
      let xp = 0;
      if (raw) {
        const tracker = JSON.parse(raw);
        xp = tracker.date === today ? (tracker.xp || 0) : 0;
      }
      xp += amount;
      await AsyncStorage.setItem(PRAYER_XP_KEY, JSON.stringify({ date: today, xp }));
    } catch {}
  }, []);

  const handlePray = useCallback(async (prayerId: string) => {
    if (prayedIds.has(prayerId)) return;
    try {
      await prayForRequest(prayerId);
      setPrayers(prev => prev.map(p =>
        p.id === prayerId ? { ...p, prayed_count: (p.prayed_count || 0) + 1 } : p
      ));
      setPrayedIds(prev => new Set(prev).add(prayerId));

      const dailyXp = await checkDailyPrayerXp();
      if (dailyXp < MAX_DAILY_PRAYER_XP) {
        const { newAchievements, leveledUp } = await awardPrayerXp(PRAY_ACTION_XP, 0, 'pray');
        await addDailyPrayerXp(PRAY_ACTION_XP);
        if (leveledUp) {
          showToast('levelup', 'Subiste de nivel!', `Ahora eres nivel ${Math.floor(Math.sqrt((await loadGamification()).xp / 100)) + 1}`);
          confettiRef.current?.start();
        }
      }
      showToast('success', 'Oracion enviada!', 'Oraste por esta peticion');
    } catch {
      showToast('info', 'Error', 'No se pudo registrar tu oracion');
    }
  }, [prayedIds, awardPrayerXp, checkDailyPrayerXp, addDailyPrayerXp, showToast, confettiRef]);

  const handleCreate = useCallback(async () => {
    const trimmed = formContent.trim();
    if (!trimmed) {
      showToast('info', 'Escribe algo', 'La peticion no puede estar vacia');
      return;
    }
    setFormSubmitting(true);
    try {
      const prayerData = {
        user_id: user?.id || 'anonymous',
        author_name: formAnonymous ? 'Anonimo' : (user?.name || 'Usuario'),
        content: trimmed,
        category: formCategory,
        is_anonymous: formAnonymous,
        testimony: formTestimony.trim() || undefined,
        prayed_count: 0,
        created_at: new Date().toISOString(),
      };
      await createPrayer(prayerData as any);
      setPrayers(prev => [{ ...prayerData, id: `temp_${Date.now()}`, has_prayed: false }, ...prev]);
      setShowCreate(false);
      setFormContent('');
      setFormCategory('Otros');
      setFormAnonymous(false);
      setFormTestimony('');

      const { newAchievements, leveledUp } = await awardPrayerXp(PRAYER_CREATE_XP, PRAYER_CREATE_COINS, 'create');
      confettiRef.current?.start();
      if (leveledUp) {
        showToast('levelup', 'Subiste de nivel!', `Ahora eres nivel ${Math.floor(Math.sqrt((await loadGamification()).xp / 100)) + 1}`);
      } else {
        showToast('success', 'Peticion publicada!', `+${PRAYER_CREATE_XP} XP y +${PRAYER_CREATE_COINS} monedas`);
      }
    } catch {
      showToast('info', 'Error', 'No se pudo publicar tu peticion');
    } finally {
      setFormSubmitting(false);
    }
  }, [formContent, formCategory, formAnonymous, formTestimony, user, awardPrayerXp, showToast, confettiRef]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.primary, flex: 1 }}>Muro de Oracion</Text>
        <Pressable
          onPress={() => setShowCreate(true)}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.tertiary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={22} color='#fff' />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44, marginBottom: 8 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {CATEGORIES.map(cat => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: activeCategory === cat ? colors.primary : colors.surfaceLow,
            }}
          >
            <Text style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: activeCategory === cat ? colors.onPrimary : colors.onSurfaceVariant,
            }}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40, fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>
            Cargando peticiones...
          </Text>
        ) : filteredPrayers.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Heart size={64} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>
              {activeCategory === 'Todas' ? 'Aun no hay peticiones' : `No hay peticiones de ${activeCategory}`}
            </Text>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
              Se el primero en compartir
            </Text>
          </View>
        ) : (
          filteredPrayers.map((prayer, index) => (
            <View
              key={prayer.id || index}
              style={{
                backgroundColor: colors.surfaceLowest,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: prayer.is_anonymous ? colors.surfaceHigh : colors.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: prayer.is_anonymous ? colors.onSurfaceVariant : colors.primary }}>
                    {(prayer.author_name || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>
                    {prayer.author_name || 'Anonimo'}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>
                    {timeAgo(prayer.created_at)}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                  backgroundColor: (CATEGORY_COLORS[prayer.category] || '#888') + '20',
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontFamily: 'SpaceGrotesk',
                    color: CATEGORY_COLORS[prayer.category] || '#888',
                  }}>
                    {prayer.category}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans', color: colors.onSurface, lineHeight: 22, marginBottom: 10 }}>
                {prayer.content}
              </Text>

              {prayer.testimony && (
                <Pressable
                  style={{
                    backgroundColor: colors.tertiary + '15',
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.tertiary, marginBottom: 2 }}>
                    Testimonio
                  </Text>
                  <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}>
                    {prayer.testimony}
                  </Text>
                </Pressable>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Heart size={14} color={prayer.prayed_count > 0 ? '#e74c3c' : colors.onSurfaceVariant} fill={prayer.prayed_count > 0 ? '#e74c3c' : 'transparent'} />
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>
                    {prayer.prayed_count || 0} {prayer.prayed_count === 1 ? 'oracion' : 'oraciones'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handlePray(prayer.id)}
                  disabled={prayedIds.has(prayer.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: prayedIds.has(prayer.id) ? colors.tertiary + '30' : colors.tertiary,
                  }}
                >
                  <Heart size={14} color={prayedIds.has(prayer.id) ? colors.tertiary : '#fff'} fill={prayedIds.has(prayer.id) ? colors.tertiary : 'transparent'} />
                  <Text style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: prayedIds.has(prayer.id) ? colors.tertiary : '#fff',
                  }}>
                    {prayedIds.has(prayer.id) ? 'Ore' : 'Ore'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showCreate} animationType='slide' transparent>
        <KeyboardAvoidingView behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => !formSubmitting && setShowCreate(false)}>
            <Pressable
              onPress={() => {}}
              style={{
                backgroundColor: colors.bg,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                maxHeight: '85%',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>
                  Nueva Peticion
                </Text>
                <Pressable onPress={() => setShowCreate(false)}>
                  <ArrowLeft size={22} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>

              <ScrollView>
                <Text style={{ fontSize: 13, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Tu peticion
                </Text>
                <TextInput
                  value={formContent}
                  onChangeText={setFormContent}
                  placeholder='Escribe tu peticion de oracion...'
                  placeholderTextColor={colors.onSurfaceVariant}
                  multiline
                  style={{
                    backgroundColor: colors.surfaceLow,
                    borderRadius: 12,
                    padding: 14,
                    minHeight: 100,
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans',
                    color: colors.onSurface,
                    textAlignVertical: 'top',
                    marginBottom: 16,
                  }}
                />

                <Text style={{ fontSize: 13, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Categoria
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {CATEGORIES.filter(c => c !== 'Todas').map(cat => (
                    <Pressable
                      key={cat}
                      onPress={() => setFormCategory(cat)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: formCategory === cat ? CATEGORY_COLORS[cat] || colors.primary : colors.surfaceLow,
                        marginRight: 8,
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        color: formCategory === cat ? '#fff' : colors.onSurfaceVariant,
                      }}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable
                  onPress={() => setFormAnonymous(!formAnonymous)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: colors.surfaceLow,
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  {formAnonymous ? <EyeOff size={20} color={colors.primary} /> : <Eye size={20} color={colors.onSurfaceVariant} />}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: formAnonymous ? colors.primary : colors.onSurface }}>
                      Publicar como Anonimo
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>
                      Tu nombre no sera visible
                    </Text>
                  </View>
                </Pressable>

                <Text style={{ fontSize: 13, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Testimonio (opcional)
                </Text>
                <TextInput
                  value={formTestimony}
                  onChangeText={setFormTestimony}
                  placeholder='Si Dios ya respondio tu peticion, comparte tu testimonio...'
                  placeholderTextColor={colors.onSurfaceVariant}
                  multiline
                  style={{
                    backgroundColor: colors.surfaceLow,
                    borderRadius: 12,
                    padding: 14,
                    minHeight: 80,
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans',
                    color: colors.onSurface,
                    textAlignVertical: 'top',
                    marginBottom: 24,
                  }}
                />

                <Pressable
                  onPress={handleCreate}
                  disabled={formSubmitting}
                  style={{
                    backgroundColor: colors.tertiary,
                    borderRadius: 14,
                    paddingVertical: 16,
                    alignItems: 'center',
                    opacity: formSubmitting ? 0.6 : 1,
                    marginBottom: 40,
                    shadowColor: colors.tertiary + '80',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 6,
                  }}
                >
                  <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: '#fff' }}>
                    {formSubmitting ? 'Publicando...' : 'Publicar Peticion'}
                  </Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <ConfettiCannon ref={confettiRef} count={40} origin={{ x: 200, y: -100 }} fadeOut autoStart={false} />
      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onDismiss={closeToast}
      />
    </SafeAreaView>
  );
}
