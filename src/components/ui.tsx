import type { Palette } from '../styles/theme';
import React, { createContext, useContext, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../state/ThemeContext';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  compact,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  compact?: boolean;
}) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        variant === 'secondary' && ui.secondary,
        variant === 'danger' && ui.danger,
        compact && { paddingVertical: 10, paddingHorizontal: 15 },
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={[
          ui.buttonText,
          variant === 'secondary' && { color: colors.ink },
          variant === 'danger' && { color: colors.red },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  hint,
  ...props
}: TextInputProps & { label: string; hint?: string }) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  return (
    <View style={{ gap: 7 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        maxLength={100}
        {...props}
        style={[
          ui.input,
          props.multiline && { minHeight: 140, textAlignVertical: 'top' },
          props.style,
        ]}
      />
      {!!hint && <Text style={styles.small}>{hint}</Text>}
    </View>
  );
}
export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  return (
    <View style={styles.wrap}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: value === option.value }}
          onPress={() => onChange(option.value)}
          style={[ui.chip, value === option.value && ui.chipActive]}
        >
          <Text style={[ui.chipText, value === option.value && { color: colors.ink }]}>
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Page({
  children,
  title,
  subtitle,
  back,
  action,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  back?: () => void;
  action?: React.ReactNode;
}) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
          {back && (
            <Pressable
              accessibilityRole="button"
              onPress={back}
              style={{ alignSelf: 'flex-start', paddingVertical: 8 }}
            >
              <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 15 }}>← Voltar</Text>
            </Pressable>
          )}
          <View style={styles.between}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
              {!!subtitle && <Text style={styles.body}>{subtitle}</Text>}
            </View>
            {action}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  return (
    <View style={{ gap: 9, paddingVertical: 24, borderTopWidth: 1, borderTopColor: colors.line }}>
      <Text style={styles.subtitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {action}
    </View>
  );
}
export function ErrorText({ message }: { message: string }) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  return message ? (
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
      {message}
    </Text>
  ) : null;
}
export function Busy({ visible }: { visible: boolean }) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  return visible ? <ActivityIndicator color={colors.ink} /> : null;
}

interface ConfirmOptions {
  title: string;
  message: string;
  accept?: string;
  destructive?: boolean;
}
interface Feedback {
  notify: (message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}
const FeedbackContext = createContext<Feedback>({ notify: () => {}, confirm: async () => false });
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { colors, styles } = useTheme();
  const ui = makeUIStyles(colors);
  const [toast, setToast] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<((result: boolean) => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = (answer: boolean) => {
    setConfirmation(null);
    resolveRef.current?.(answer);
    resolveRef.current = null;
  };
  const notify = (message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(''), 4500);
  };
  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setConfirmation(options);
    });
  return (
    <FeedbackContext.Provider value={{ notify, confirm }}>
      {children}
      {!!toast && (
        <Pressable
          onPress={() => setToast('')}
          accessibilityRole="button"
          accessibilityLabel={`${toast}. Fechar mensagem`}
          style={ui.toast}
        >
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.onAccent, fontWeight: '600', textAlign: 'center' }}
          >
            {toast}
          </Text>
        </Pressable>
      )}
      <Modal
        visible={!!confirmation}
        transparent
        animationType="fade"
        onRequestClose={() => close(false)}
      >
        <View style={ui.overlay}>
          <View accessibilityViewIsModal style={[styles.card, { width: '100%', maxWidth: 430 }]}>
            <Text style={styles.subtitle}>{confirmation?.title}</Text>
            <Text style={styles.body}>{confirmation?.message}</Text>
            <Button
              label={confirmation?.accept ?? 'Confirmar'}
              variant={confirmation?.destructive ? 'danger' : 'primary'}
              onPress={() => close(true)}
            />
            <Button label="Cancelar" variant="secondary" onPress={() => close(false)} />
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}
export const useFeedback = () => useContext(FeedbackContext);
export const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
const makeUIStyles = (colors: Palette) =>
  StyleSheet.create({
    button: {
      minHeight: 48,
      paddingHorizontal: 22,
      paddingVertical: 15,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
    danger: { backgroundColor: colors.softRed, borderWidth: 1, borderColor: `${colors.red}55` },
    buttonText: { color: colors.onAccent, fontWeight: '500', fontSize: 14 },
    label: { fontSize: 13, color: colors.ink, fontWeight: '500' },
    input: {
      minHeight: 52,
      padding: 15,
      borderRadius: 9,
      borderColor: colors.line,
      borderWidth: 1,
      color: colors.ink,
      backgroundColor: colors.input,
      fontSize: 16,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
    },
    chipActive: { backgroundColor: colors.mint, borderColor: colors.selectionBorder },
    chipText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
    toast: {
      position: 'absolute',
      bottom: 100,
      left: 24,
      right: 24,
      maxWidth: 600,
      alignSelf: 'center',
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.accent,
      zIndex: 20,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(20,40,30,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
  });
