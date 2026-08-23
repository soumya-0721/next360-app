import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOW } from '../utils/theme';
import { DEFAULT_USERS } from '../utils/data';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (e) {
      setError(e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  const getRoleColor = (role) => {
    if (role === 'CEO') return '#7c3aed';
    if (role === 'CTO') return '#2563eb';
    return COLORS.primary;
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.card}>
          <View style={s.logoWrap}>
            <Text style={s.logoEmoji}>🌿</Text>
            <Text style={s.companyName}>Next360 Organic Products</Text>
            <Text style={s.subtitle}>Office Attendance Dashboard</Text>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Email Address</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Password</Text>
            <View style={s.passWrapper}>
              <TextInput
                style={s.passInput}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={s.passToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={s.passToggleText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? <Text style={s.errorMsg}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, s.btnPrimary, loading && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={s.btnText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <View style={s.quickSection}>
            <Text style={s.quickTitle}>⚡ Quick Login</Text>
            <View style={s.quickGrid}>
              {DEFAULT_USERS.map((u) => (
                <TouchableOpacity
                  key={u.email}
                  style={s.quickBtn}
                  onPress={() => handleQuickLogin(u)}
                >
                  <Text style={s.quickName}>{u.name}</Text>
                  <Text style={[s.quickRole, { color: getRoleColor(u.role) }]}>
                    {u.role}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064e3b',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 36,
    width: '100%',
    maxWidth: 420,
    ...SHADOW,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  passWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.card,
  },
  passInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  passToggle: {
    paddingHorizontal: 14,
  },
  passToggleText: {
    fontSize: 18,
  },
  errorMsg: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  quickSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 20,
  },
  quickTitle: {
    fontSize: 12,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickBtn: {
    width: '48%',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    padding: 12,
    marginBottom: 8,
  },
  quickName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickRole: {
    fontSize: 10,
    marginTop: 2,
  },
});
