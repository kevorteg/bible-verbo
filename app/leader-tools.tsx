import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Users, BookOpen, TrendingUp, Trophy, Plus, LogOut, Cross } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useGamification } from '../hooks/useGamification';
import { getMyGroup, createOrJoinGroup, leaveGroup, getGroupReadingLog, Group } from '../services/groupService';

export default function LeaderToolsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data } = useGamification();
  const [group, setGroup] = useState<Group | null>(null);
  const [activity, setActivity] = useState<{ userName: string; chapterName: string; date: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const g = await getMyGroup();
    setGroup(g);
    const log = await getGroupReadingLog();
    setActivity(log);
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    await createOrJoinGroup(groupName.trim(), groupDesc.trim());
    setGroupName('');
    setGroupDesc('');
    setShowCreate(false);
    await loadData();
  };

  const handleLeave = () => {
    Alert.alert('Salir del grupo', 'Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await leaveGroup(); setGroup(null); } },
    ]);
  };

  const topMembers = group ? [...group.members].sort((a, b) => b.chaptersRead - a.chaptersRead) : [];
  const totalChapters = group ? group.members.reduce((sum, m) => sum + m.chaptersRead, 0) + data.chaptersRead : data.chaptersRead;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
            <ArrowLeft size={22} color={colors.onSurface} />
          </Pressable>
          <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.primary }}>Lideres</Text>
        </View>
        {group && (
          <Pressable onPress={handleLeave} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {!group ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Users size={80} color={colors.onSurfaceVariant} />
            <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}>No hay grupo aun</Text>
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 20 }}>
              Crea un grupo para ver estadisticas colectivas y el progreso de tu equipo
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              style={{ backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Crear grupo</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8, borderLeftWidth: 4, borderLeftColor: colors.primary }}>
              <Text style={{ fontSize: 18, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{group.name}</Text>
              {group.description ? <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginTop: 4 }}>{group.description}</Text> : null}
              <View style={{ backgroundColor: colors.surfaceHigh, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginTop: 8 }}>
                <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>Codigo: {group.code}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
                <Users size={20} color={colors.primary} />
                <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginTop: 4 }}>{group.members.length + 1}</Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Miembros</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
                <BookOpen size={20} color={colors.tertiary} />
                <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginTop: 4 }}>{totalChapters}</Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Capitulos totales</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
                <Trophy size={20} color={green} />
                <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginTop: 4 }}>{topMembers[0]?.chaptersRead || 0}</Text>
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Record grupal</Text>
              </View>
            </View>

            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Top Lectores</Text>
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 12, marginBottom: 16, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              {topMembers.slice(0, 5).map((m, i) => {
                const maxReads = topMembers[0]?.chaptersRead || 1;
                const barWidth = (m.chaptersRead / maxReads) * 100;
                const podiums = ['#FFD700', '#C0C0C0', '#CD7F32'];
                return (
                  <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: i < Math.min(topMembers.length, 5) - 1 ? 1 : 0, borderBottomColor: colors.surfaceHigh }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: i < 3 ? podiums[i] + '30' : colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontFamily: 'SpaceGrotesk_700Bold', color: i < 3 ? podiums[i] : colors.onSurfaceVariant }}>{i + 1}</Text>
                    </View>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>{m.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>{m.name}</Text>
                      <View style={{ height: 6, backgroundColor: colors.surfaceHigh, borderRadius: 3, overflow: 'hidden', marginTop: 2 }}>
                        <View style={{ width: `${barWidth}%`, height: '100%', backgroundColor: i < 3 ? podiums[i] : colors.primary, borderRadius: 3 }} />
                      </View>
                    </View>
                    <Text style={{ fontSize: 14, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>{m.chaptersRead}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Actividad Reciente</Text>
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 16, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              {activity.length === 0 ? (
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 20 }}>
                  Aun no hay actividad registrada
                </Text>
              ) : (
                activity.slice(0, 10).map((entry, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: i < Math.min(activity.length, 10) - 1 ? 1 : 0, borderBottomColor: colors.surfaceHigh }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}>{entry.userName} leyo {entry.chapterName}</Text>
                      <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{new Date(entry.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Nuevo grupo</Text>
              <Pressable onPress={() => setShowCreate(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeft size={20} color={colors.onSurface} />
              </Pressable>
            </View>

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Nombre del grupo</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Ej: Jovenes IPUC"
              placeholderTextColor={colors.onSurfaceVariant}
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16 }}
            />

            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Descripcion (opcional)</Text>
            <TextInput
              value={groupDesc}
              onChangeText={setGroupDesc}
              placeholder="Describe tu grupo..."
              placeholderTextColor={colors.onSurfaceVariant}
              multiline
              style={{ backgroundColor: colors.surfaceLow, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 24, minHeight: 60 }}
            />

            <Pressable
              onPress={handleCreate}
              style={{ backgroundColor: colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 6 }}
            >
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Crear grupo</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const green = '#2E7D32';
