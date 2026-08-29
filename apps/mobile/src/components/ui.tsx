import type { PropsWithChildren } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type ViewStyle,
  View,
} from 'react-native'

import { colors } from '@/lib/colors'

export function Screen({ children }: PropsWithChildren) {
  return <View style={styles.screen}>{children}</View>
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Title({ children }: PropsWithChildren) {
  return <Text style={styles.title}>{children}</Text>
}

export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>
}

export function Field(props: TextInputProps) {
  return (
    <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.field, props.style]} />
  )
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {disabled ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  title: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  field: {
    backgroundColor: '#ffffff',
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 14,
    color: colors.ink,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.wine,
    borderRadius: 999,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.65 },
})
