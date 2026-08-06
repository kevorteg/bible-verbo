import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, ArrowLeft, Rocket } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      router.back();
    } catch (e: any) {
      setError(e.message || 'Error al registrarse');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Pressable onPress={() => router.back()} style={{ marginBottom: 24 }}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </Pressable>

          <Text style={{ fontSize: 32, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginBottom: 8 }}>Crear Cuenta</Text>
          <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginBottom: 32 }}>
            Unete a la comunidad Verbo
          </Text>

          {/* Name */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary, marginBottom: 8, marginLeft: 8, textTransform: 'uppercase' }}>Nombre</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 24, borderWidth: 2, borderColor: colors.outlineVariant, paddingHorizontal: 16 }}>
              <User size={20} color={colors.onSurfaceVariant} />
              <TextInput
                style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
                placeholder="Tu nombre"
                placeholderTextColor={colors.outlineVariant}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary, marginBottom: 8, marginLeft: 8, textTransform: 'uppercase' }}>Email</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 24, borderWidth: 2, borderColor: colors.outlineVariant, paddingHorizontal: 16 }}>
              <Mail size={20} color={colors.onSurfaceVariant} />
              <TextInput
                style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
                placeholder="email@verbo.com"
                placeholderTextColor={colors.outlineVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary, marginBottom: 8, marginLeft: 8, textTransform: 'uppercase' }}>Contrasena</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 24, borderWidth: 2, borderColor: colors.outlineVariant, paddingHorizontal: 16 }}>
              <Lock size={20} color={colors.onSurfaceVariant} />
              <TextInput
                style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
                placeholder="Min. 6 caracteres"
                placeholderTextColor={colors.onSurfaceVariant}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Error */}
          {error ? (
            <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: '#e74c3c', marginBottom: 12, textAlign: 'center' }}>{error}</Text>
          ) : null}

          {/* CTA Button */}
          <Pressable
            onPress={handleRegister}
            disabled={submitting}
              style={{
                width: '100%', backgroundColor: submitting ? colors.surfaceHigh : colors.primary,
              paddingVertical: 16, borderRadius: 24,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 1, shadowRadius: 0, elevation: 6,
              borderBottomWidth: 4, borderBottomColor: colors.primaryShadow, marginTop: 24,
            }}
          >
              {submitting ? (
              <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
            ) : (
              <>
                <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onPrimary }}>Crear Cuenta</Text>
                <Rocket size={24} color={colors.onPrimary} />
              </>
            )}
          </Pressable>

          {/* Login Link */}
          <Pressable onPress={() => router.replace('/auth/login')} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.secondary }}>
              Ya tienes cuenta? <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Inicia sesion</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
