// app/(auth)/register.js
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

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]               = useState(false);
  const [errors, setErrors]                 = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = 'El nombre debe tener al menos 2 caracteres';
    if (!email.trim())
      e.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Email inválido';
    if (!password || password.length < 6)
      e.password = 'La contraseña debe tener mínimo 6 caracteres';
    if (password !== confirmPassword)
      e.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      Alert.alert('Revisa los datos', Object.values(e)[0]);
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (err) {
      console.error('Error al registrarse:', err);
      Alert.alert(
        'Error al registrarse',
        err.message || 'No se pudo conectar con el servidor backend en tu PC. Verifica que el backend esté encendido.'
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
      <LinearGradient
        colors={['#0E0B07', '#1C1610', '#0E0B07']}
        style={StyleSheet.absoluteFill}
      />
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
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
            style={styles.logoCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="person-add" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Únete y empieza a guardar tus recetas</Text>
        </View>

        {/* Formulario */}
        <View style={styles.card}>
          <Input label="Nombre" value={name} onChangeText={setName}
            placeholder="Tu nombre" error={errors.name} />
          <Input label="Email" value={email} onChangeText={setEmail}
            placeholder="tu@email.com" keyboardType="email-address"
            autoCapitalize="none" error={errors.email} />
          <Input label="Contraseña" value={password} onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres" secureTextEntry error={errors.password} />
          <Input label="Confirmar contraseña" value={confirmPassword}
            onChangeText={setConfirmPassword} placeholder="Repite la contraseña"
            secureTextEntry error={errors.confirmPassword} />

          <Button title="Crear cuenta" onPress={handleRegister}
            loading={loading} style={styles.btn} />

          <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginHighlight}>Inicia sesión</Text>
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
    height: 240,
    opacity: 0.5,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  btn:        { marginTop: 8 },
  loginLink:  { alignItems: 'center', marginTop: 20 },
  loginText:  { fontSize: Typography.md, color: Colors.textSecondary },
  loginHighlight: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
});
