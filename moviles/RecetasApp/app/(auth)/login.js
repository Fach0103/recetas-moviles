// app/(auth)/login.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Colors from '../../src/theme/colors';
import Typography from '../../src/theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim())  e.email    = 'El email es obligatorio';
    if (!password)      e.password = 'La contraseña es obligatoria';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      Alert.alert('Revisa los datos', Object.values(e)[0]);
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      Alert.alert(
        'Error al iniciar sesión',
        err.message || 'No se pudo conectar con el backend o credenciales inválidas'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Fondo cálido */}
      <LinearGradient
        colors={['#0E0B07', '#1C1610', '#0E0B07']}
        style={StyleSheet.absoluteFill}
      />

      {/* Motivo decorativo superior */}
      <LinearGradient
        colors={[Colors.primaryGlow, 'transparent']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 44, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo / Hero ── */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
            style={styles.logoCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="restaurant" size={38} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>RecetasApp</Text>
          <Text style={styles.tagline}>Tus recetas, a un toque ✨</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenido de vuelta</Text>
          <Text style={styles.cardSubtitle}>Inicia sesión en tu cuenta</Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            style={styles.inputSpacing}
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              ¿No tienes cuenta?{' '}
              <Text style={styles.registerHighlight}>Regístrate</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    opacity: 0.6,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  appName: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 1.2,
  },
  tagline: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  inputSpacing: { marginBottom: 0 },
  loginBtn:    { marginTop: 12 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.sm, color: Colors.textMuted },
  registerLink: { alignItems: 'center' },
  registerText: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
  },
  registerHighlight: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
});
