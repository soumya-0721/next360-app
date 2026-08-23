import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SHADOW } from '../utils/theme';

export function Badge({ label, text, color, bgColor }) {
  return (
    <View style={[s.badge, { backgroundColor: bgColor || COLORS.primaryLight }]}>
      <Text style={[s.badgeText, { color: color || COLORS.primaryDark }]}>{label || text}</Text>
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function StatCard({ label, title, value, sub, color }) {
  const borderColor = color || COLORS.primary;
  return (
    <View style={[s.statCard, { borderLeftColor: borderColor }]}>
      <Text style={s.statLabel}>{label || title}</Text>
      <Text style={[s.statValue, { color: borderColor }]}>{value}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, style }) {
  return (
    <TouchableOpacity
      style={[s.btn, s.btnPrimary, disabled && s.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={s.btnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function DangerButton({ title, onPress, disabled, style }) {
  return (
    <TouchableOpacity
      style={[s.btn, s.btnDanger, disabled && s.btnDisabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={s.btnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, style }) {
  return (
    <TouchableOpacity style={[s.btn, s.btnSecondary, style]} onPress={onPress}>
      <Text style={[s.btnText, { color: COLORS.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState({ icon, message }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{icon || '📭'}</Text>
      <Text style={s.emptyText}>{message}</Text>
    </View>
  );
}

export function SectionHeader({ title, right }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

const s = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 18, marginBottom: 16, ...SHADOW },
  statCard: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, borderLeftWidth: 4, marginBottom: 12, ...SHADOW },
  statLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 26, fontWeight: '800', marginVertical: 4 },
  statSub: { fontSize: 11, color: COLORS.textLight },
  btn: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnDanger: { backgroundColor: COLORS.danger },
  btnSecondary: { backgroundColor: COLORS.border },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 13, color: COLORS.textLight },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});
