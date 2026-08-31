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
import { Title } from '@/components/title'
import { fontFamilyFor } from '@/lib/theme'

export { Title }

export function Screen({ children }: PropsWithChildren) {
  return <View style={styles.screen}>{children}</View>
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>
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
  screen: { backgroundColor: colors.paper, flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
  },
  label: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 13,
    marginBottom: 7,
  },
  field: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 17,
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.emerald,
    borderRadius: 999,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonText: { color: colors.white, fontFamily: fontFamilyFor('sans', 600), fontSize: 15 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.65 },
})
