// app/(tabs)/profile.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { usersApi } from '../../src/api/users';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Colors from '../../src/theme/colors';
import Typography from '../../src/theme/typography';

// ── Modal de edición ──
function EditProfileModal({ visible, onClose, user, onSaved }) {
  const [name,     setName]     = useState(user?.name  || '');
  const [email,    setEmail]    = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  React.useEffect(() => {
    if (visible) {
      setName(user?.name  || '');
      setEmail(user?.email || '');
      setPassword('');
      setErrors({});
    }
  }, [visible, user]);

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2)
      e.name = 'Mínimo 2 caracteres';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Email inválido';
    if (password && password.length < 6)
      e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {};
    if (name.trim()           !== user.name)  payload.name     = name.trim();
    if (email.trim().toLowerCase() !== user.email) payload.email = email.trim().toLowerCase();
    if (password)                              payload.password = password;

    if (Object.keys(payload).length === 0) {
      Alert.alert('Sin cambios', 'No modificaste ningún campo');
      return;
    }

    setLoading(true);
    try {
      const data = await usersApi.updateMe(payload);
      onSaved(data.user);
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Editar perfil</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input label="Nombre"     value={name}  onChangeText={setName}
              placeholder="Tu nombre" error={errors.name} />
            <Input label="Email"      value={email} onChangeText={setEmail}
              placeholder="tu@email.com" keyboardType="email-address"
              autoCapitalize="none" error={errors.email} />
            <Input label="Nueva contraseña (opcional)" value={password}
              onChangeText={setPassword} placeholder="Déjalo vacío para no cambiar"
              secureTextEntry error={errors.password} />
          </ScrollView>
          <View style={styles.sheetActions}>
            <Button title="Cancelar" onPress={onClose} variant="ghost" style={styles.actionBtn} />
            <Button title="Guardar"  onPress={handleSave} loading={loading} style={styles.actionBtn} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Fila de información ──
function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateLocalUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [editModal,        setEditModal]        = useState(false);
  const [deletingAccount,  setDeletingAccount]  = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
    : '';

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Borrar cuenta',
      'Esta acción es IRREVERSIBLE.\nSe eliminarán tu cuenta, todas tus recetas y grupos.\n\n¿Estás completamente seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, borrar mi cuenta',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await usersApi.deleteMe();
              await logout();
            } catch (err) {
              Alert.alert('Error', err.message);
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.primaryGlow, 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {memberSince ? (
            <View style={styles.memberBadge}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.memberSince}>Miembro desde {memberSince}</Text>
            </View>
          ) : null}
        </View>

        {/* Tarjeta de información */}
        <View style={styles.infoCard}>
          <InfoRow icon="person-outline" label="Nombre" value={user?.name} />
          <View style={styles.divider} />
          <InfoRow icon="mail-outline"   label="Email"  value={user?.email} />
        </View>

        {/* Acciones */}
        <Button
          title="Editar perfil"
          onPress={() => setEditModal(true)}
          variant="secondary"
          icon={<Ionicons name="create-outline" size={18} color={Colors.primary} />}
          style={styles.actionBtn}
        />
        <Button
          title="Cerrar sesión"
          onPress={handleLogout}
          variant="ghost"
          icon={<Ionicons name="log-out-outline" size={18} color={Colors.textSecondary} />}
          style={styles.actionBtn}
        />

        {/* Zona de peligro */}
        <View style={styles.dangerZone}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning-outline" size={20} color={Colors.error} />
            <Text style={styles.dangerTitle}>Zona de peligro</Text>
          </View>
          <Text style={styles.dangerSubtitle}>
            Al borrar tu cuenta se eliminarán permanentemente todos tus datos,
            recetas y grupos. Esta acción no se puede deshacer.
          </Text>
          <Button
            title="Borrar cuenta"
            onPress={handleDeleteAccount}
            variant="danger"
            loading={deletingAccount}
            icon={<Ionicons name="trash-outline" size={18} color={Colors.error} />}
          />
        </View>
      </ScrollView>

      <EditProfileModal
        visible={editModal}
        onClose={() => setEditModal(false)}
        user={user}
        onSaved={(updated) => {
          updateLocalUser(updated);
          Alert.alert('✅ Perfil actualizado', 'Tus cambios se guardaron correctamente.');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  headerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 220,
    opacity: 0.5,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: Typography.extrabold,
    color: '#fff',
    letterSpacing: 2,
  },
  userName: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: Typography.md,
    color: Colors.textSecondary,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberSince: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.md,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  actionBtn: { marginBottom: 12 },
  dangerZone: {
    marginTop: 16,
    padding: 20,
    backgroundColor: Colors.errorLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: 10,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.error,
  },
  dangerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // Modal
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: { flex: 1 },
});
