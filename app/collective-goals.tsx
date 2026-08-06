import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Target, CheckCircle2, TrendingUp, Users, Plus, Gift, Trophy } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getActiveGoals, createGoal, CollectiveGoal, Milestone } from '../services/collectiveGoals';

const green = '#2E7D32';

export default function CollectiveGoalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [goals, setGoals] = useState<CollectiveGoal[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetChapters, setTargetChapters] = useState('100');
  const [endDate, setEndDate] = useState('');

  useFocusEffect(
    useCallback(() => {
      getActiveGoals().then(setGoals);
    }, [])
  );

  const handleCreate = async () => {
    if (!title.trim() || !targetChapters) return;
    const parsedTarget = parseInt(targetChapters);
    if (isNaN(parsedTarget) || parsedTarget < 1) return;

    const milestones: Milestone[] = [
      { chapters: Math.floor(parsedTarget * 0.25), label: '25% completado', rewardCoins: 50, rewardXp: 100 },
      { chapters: Math.floor(parsedTarget * 0.5), label: '50% completado', rewardCoins: 100, rewardXp: 200 },
      { chapters: Math.floor(parsedTarget * 0.75), label: '75% completado', rewardCoins: 150, rewardXp: 300 },
    ];

    const endStr = endDate.trim() || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    await createGoal({
      title: title.trim(),
      description: description.trim(),
      targetChapters: parsedTarget,
      milestones,
      startDate: new Date().toISOString().split('T')[0],
      endDate: endStr,
    });

    setTitle('');
    setDescription('');
    setTargetChapters('100');
    setEndDate('');
    setShowCreate(false);
    const updated = await getActiveGoals();
    setGoals(updated);
  };

  const progressPercent = (goal: CollectiveGoal) =>
    goal.targetChapters > 0 ? Math.min((goal.currentChapters / goal.targetChapters) * 100, 100) : 0;

  const daysLeft = (goal: CollectiveGoal) => {
    const end = new Date(goal.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
            <ArrowLeft size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Metas Colectivas</Text>
        </View>
        <Pressable
          onPress={() => setShowCreate(true)}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
        >
          <Plus size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {goals.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 80 }}>
            <Target size={80} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>No hay metas activas</Text>
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>Crea una meta de lectura para tu grupo</Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Crear meta</Text>
            </Pressable>
          </View>
        ) : (
          goals.map(goal => (
            <View
              key={goal.id}
              style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8, borderLeftWidth: 4, borderLeftColor: progressPercent(goal) >= 100 ? green : colors.primary }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{goal.title}</Text>
                  {goal.description ? (
                    <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginTop: 4 }}>{goal.description}</Text>
                  ) : null}
                </View>
                {progressPercent(goal) >= 100 && (
                  <View style={{ backgroundColor: green, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 10, fontFamily: 'SpaceGrotesk', color: '#FFFFFF' }}>COMPLETADO</Text>
                  </View>
                )}
              </View>

              <View style={{ height: 12, backgroundColor: colors.surfaceHigh, borderRadius: 6, overflow: 'hidden', marginTop: 8 }}>
                <View style={{ width: `${progressPercent(goal)}%`, height: '100%', backgroundColor: progressPercent(goal) >= 100 ? green : colors.primary, borderRadius: 6 }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.primary }}>{goal.currentChapters}/{goal.targetChapters} capitulos</Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{progressPercent(goal).toFixed(0)}%</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Users size={14} color={colors.onSurfaceVariant} />
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Grupal</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={14} color={colors.tertiary} />
                  <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.tertiary }}>{daysLeft(goal)} dias restantes</Text>
                </View>
              </View>

              {goal.milestones.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Logros</Text>
                  {goal.milestones.map((m, i) => {
                    const reached = goal.reachedMilestones.includes(m.chapters);
                    return (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: reached ? green + '20' : colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' }}>
                          {reached ? <CheckCircle2 size={14} color={green} /> : <Gift size={14} color={colors.onSurfaceVariant} />}
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans', color: reached ? green : colors.onSurfaceVariant, textDecorationLine: reached ? 'line-through' : 'none' }}>
                          {m.label}
                        </Text>
                        {reached && <Text style={{ fontSize: 11, fontFamily: 'SpaceGrotesk', color: green }}>+{m.rewardCoins} monedas</Text>}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Nueva meta colectiva</Text>
              <Pressable onPress={() => setShowCreate(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Titulo</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Leer el NT en 30 dias"
              placeholderTextColor={colors.onSurfaceVariant}
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16 }}
            />

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Descripcion (opcional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe la meta..."
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16, minHeight: 60 }}
            />

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Capitulos objetivo</Text>
            <TextInput
              value={targetChapters}
              onChangeText={setTargetChapters}
              placeholder="100"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="number-pad"
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16 }}
            />

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Fecha limite (YYYY-MM-DD, opcional)</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
              placeholderTextColor={colors.onSurfaceVariant}
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 24 }}
            />

            <Pressable
              onPress={handleCreate}
              style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Crear meta</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
