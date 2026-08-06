import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, Star, Mail, Lock, Eye, EyeOff, Rocket, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { loginWithMagicCode, sendPasswordResetOtp, verifyEmailOtp } from '../../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Forgot password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // OTP login
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.back();
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) { return; }
    setResetLoading(true);
    try {
      await sendPasswordResetOtp(resetEmail.trim());
      setResetSent(true);
    } catch (e: any) {
      setError(e.message || 'Error al enviar codigo');
    } finally {
      setResetLoading(false);
    }
  };

  const handleOtpSend = async () => {
    if (!otpEmail.trim()) { return; }
    setOtpLoading(true);
    try {
      await loginWithMagicCode(otpEmail.trim());
      setOtpStep('code');
    } catch (e: any) {
      setError(e.message || 'Error al enviar codigo');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otpCode.trim()) { return; }
    setOtpLoading(true);
    try {
      await verifyEmailOtp(otpEmail.trim(), otpCode.trim());
      router.back();
    } catch (e: any) {
      setError(e.message || 'Codigo invalido');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24 }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 20 }}>
            <View style={{
              width: 128, height: 128, backgroundColor: colors.primary, borderRadius: 16,
              alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '3deg' }],
              borderWidth: 4, borderColor: colors.primaryShadow,
              shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 1, shadowRadius: 0, elevation: 6, marginBottom: 16,
            }}>
              <BookOpen size={72} color={colors.onPrimary} />
            </View>
            <Text style={{ fontSize: 40, fontFamily: 'BricolageGrotesque', color: colors.primary, textAlign: 'center' }}>Hola!</Text>
            <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center' }}>Listo para crecer en la Palabra?</Text>
          </View>

          {/* Card */}
          <View style={{
            width: '100%', backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24,
            shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
            borderWidth: 2, borderColor: colors.surfaceHigh,
          }}>
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
                  placeholder="********"
                  placeholderTextColor={colors.onSurfaceVariant}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={colors.onSurfaceVariant} /> : <Eye size={20} color={colors.onSurfaceVariant} />}
                </Pressable>
              </View>
            </View>

            {/* Forgot Password */}
            <Pressable onPress={() => { setResetEmail(email); setShowForgotModal(true); }} style={{ alignItems: 'flex-end', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.secondary }}>Olvidaste tu contrasena?</Text>
            </Pressable>

            {/* Error */}
            {error ? (
              <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: '#e74c3c', marginBottom: 12, textAlign: 'center' }}>{error}</Text>
            ) : null}

            {/* CTA Button */}
            <Pressable
              onPress={handleLogin}
              disabled={submitting}
              style={{
                width: '100%', backgroundColor: submitting ? colors.surfaceHigh : colors.primary,
                paddingVertical: 16, borderRadius: 24,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 1, shadowRadius: 0, elevation: 6,
                borderBottomWidth: 4, borderBottomColor: colors.primaryShadow,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
              ) : (
                <>
                  <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onPrimary }}>Vamos!</Text>
                  <Rocket size={24} color={colors.onPrimary} />
                </>
              )}
            </Pressable>

            {/* Register Link */}
            <Pressable onPress={() => router.replace('/auth/register')} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.secondary }}>
                No tienes cuenta? <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Registrate</Text>
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
              <View style={{ flex: 1, height: 2, backgroundColor: colors.surfaceHigh }} />
              <Text style={{ marginHorizontal: 16, fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.outlineVariant, textTransform: 'uppercase' }}>O con email</Text>
              <View style={{ flex: 1, height: 2, backgroundColor: colors.surfaceHigh }} />
            </View>

            {/* OTP Login Button */}
            <Pressable
              onPress={() => { setOtpEmail(email); setOtpStep('email'); setShowOtpModal(true); }}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: colors.surfaceLowest, borderWidth: 2, borderColor: colors.secondary,
                paddingVertical: 12, borderRadius: 24,
                shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8,
              }}
            >
              <Mail size={18} color={colors.secondary} />
              <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.secondary }}>Enviar codigo por email</Text>
            </Pressable>
          </View>

          {/* Footer Perks */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 24, opacity: 0.9 }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 40, height: 40, backgroundColor: colors.secondary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.onSecondary, fontSize: 10, fontFamily: 'SpaceGrotesk' }}>✓</Text>
              </View>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary }}>Seguro</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 40, height: 40, backgroundColor: colors.tertiary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Star size={20} color={colors.onTertiary} />
              </View>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary }}>Divertido</Text>
            </View>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 40, height: 40, backgroundColor: colors.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: colors.onPrimary, fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold' }}>G</Text>
              </View>
              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary }}>Global</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={showForgotModal} transparent animationType="fade" onRequestClose={() => setShowForgotModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowForgotModal(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, width: '85%', maxWidth: 340, shadowColor: 'rgba(0,0,0,0.15)', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 0, elevation: 12 }}>
            <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginBottom: 8 }}>Recuperar contrasena</Text>
            <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, marginBottom: 16 }}>
              Te enviaremos un codigo a tu email para restablecer tu contrasena.
            </Text>
            {!resetSent ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 24, borderWidth: 2, borderColor: colors.outlineVariant, paddingHorizontal: 16, marginBottom: 16 }}>
                  <Mail size={20} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
                    placeholder="Tu email"
                    placeholderTextColor={colors.outlineVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                  />
                </View>
                <Pressable
                  onPress={handleForgotPassword}
                  disabled={resetLoading}
                  style={{ backgroundColor: resetLoading ? colors.surfaceHigh : colors.primary, borderRadius: 24, paddingVertical: 14, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}
                >
                  {resetLoading ? (
                    <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
                  ) : (
                    <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Enviar codigo</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <Text style={{ fontSize: 40, fontFamily: 'BricolageGrotesque', color: colors.primary, marginBottom: 8 }}>✓</Text>
                <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface, textAlign: 'center' }}>Codigo enviado!</Text>
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>Revisa tu bandeja de entrada.</Text>
                <Pressable onPress={() => setShowForgotModal(false)} style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.secondary }}>Cerrar</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* OTP Login Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade" onRequestClose={() => setShowOtpModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowOtpModal(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 24, width: '85%', maxWidth: 340, shadowColor: 'rgba(0,0,0,0.15)', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 0, elevation: 12 }}>
            <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.onSurface, marginBottom: 16, textAlign: 'center' }}>
              {otpStep === 'email' ? 'Ingresa tu email' : 'Ingresa el codigo'}
            </Text>
            {otpStep === 'email' ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 24, borderWidth: 2, borderColor: colors.outlineVariant, paddingHorizontal: 16, marginBottom: 16 }}>
                  <Mail size={20} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
                    placeholder="email@verbo.com"
                    placeholderTextColor={colors.outlineVariant}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={otpEmail}
                    onChangeText={setOtpEmail}
                  />
                </View>
                <Pressable
                  onPress={handleOtpSend}
                  disabled={otpLoading}
                  style={{ backgroundColor: otpLoading ? colors.surfaceHigh : colors.primary, borderRadius: 24, paddingVertical: 14, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
                  ) : (
                    <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Enviar codigo</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: 24, borderWidth: 2, borderColor: colors.outlineVariant, paddingHorizontal: 16, marginBottom: 16 }}>
                  <Lock size={20} color={colors.onSurfaceVariant} />
                  <TextInput
                    style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}
                    placeholder="Codigo de 6 digitos"
                    placeholderTextColor={colors.outlineVariant}
                    keyboardType="number-pad"
                    value={otpCode}
                    onChangeText={setOtpCode}
                  />
                </View>
                <Pressable
                  onPress={handleOtpVerify}
                  disabled={otpLoading}
                  style={{ backgroundColor: otpLoading ? colors.surfaceHigh : colors.primary, borderRadius: 24, paddingVertical: 14, alignItems: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}
                >
                  {otpLoading ? (
                    <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
                  ) : (
                    <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Verificar</Text>
                  )}
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
