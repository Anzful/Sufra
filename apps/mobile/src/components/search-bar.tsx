import Ionicons from '@expo/vector-icons/Ionicons'
import { BlurView } from 'expo-blur'
import { useEffect, useRef, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native'
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { colors } from '@/lib/colors'
import { fontFamilyFor } from '@/lib/theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface SearchBarProps {
  cancelLabel: string
  clearLabel: string
  filterActive?: boolean
  filterLabel?: string
  onChangeText: (value: string) => void
  onClear?: () => void
  onFilterPress?: () => void
  onSearchDone?: (value: string) => void
  placeholder: string
  style?: StyleProp<ViewStyle>
  value: string
}

export function SearchBar({
  cancelLabel,
  clearLabel,
  filterActive = false,
  filterLabel,
  onChangeText,
  onClear,
  onFilterPress,
  onSearchDone,
  placeholder,
  style,
  value,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)
  const reduceMotion = useReducedMotion()
  const focusProgress = useSharedValue(0)
  const clearProgress = useSharedValue(value.length ? 1 : 0)

  useEffect(() => {
    clearProgress.value = withTiming(value.length ? 1 : 0, {
      duration: reduceMotion ? 0 : 180,
      easing: Easing.out(Easing.quad),
    })
  }, [clearProgress, reduceMotion, value.length])

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], [colors.line, colors.mint]),
    marginRight: interpolate(focusProgress.value, [0, 1], [0, 76]),
    transform: [{ scale: interpolate(focusProgress.value, [0, 1], [1, 0.992]) }],
  }))

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focusProgress.value, [0, 0.45, 1], [0, 0, 1]),
    transform: [{ translateX: interpolate(focusProgress.value, [0, 1], [18, 0]) }],
  }))

  const clearStyle = useAnimatedStyle(() => ({
    opacity: clearProgress.value,
    transform: [{ scale: interpolate(clearProgress.value, [0, 1], [0.72, 1]) }],
  }))

  function animateFocus(next: boolean) {
    setFocused(next)
    focusProgress.value = reduceMotion
      ? withTiming(next ? 1 : 0, { duration: 0 })
      : next
        ? withSpring(1, { damping: 19, mass: 0.72, stiffness: 210 })
        : withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) })
  }

  function clear() {
    onChangeText('')
    onClear?.()
  }

  function cancel() {
    clear()
    inputRef.current?.blur()
    animateFocus(false)
  }

  return (
    <View style={[styles.root, style]}>
      <Animated.View style={[styles.field, fieldStyle]}>
        <BlurView
          intensity={28}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          tint="light"
        />
        <Ionicons color={focused ? colors.emerald : colors.muted} name="search" size={18} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          cursorColor={colors.emerald}
          onBlur={() => animateFocus(false)}
          onChangeText={onChangeText}
          onFocus={() => animateFocus(true)}
          onSubmitEditing={() => {
            onSearchDone?.(value)
            inputRef.current?.blur()
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedLight}
          ref={inputRef}
          returnKeyType="search"
          selectionColor={colors.mint}
          style={styles.input}
          value={value}
        />
        <AnimatedPressable
          accessibilityLabel={clearLabel}
          accessibilityRole="button"
          disabled={!value.length}
          hitSlop={10}
          onPress={() => {
            clear()
            inputRef.current?.focus()
          }}
          style={[styles.clearButton, clearStyle]}
        >
          <Ionicons color={colors.muted} name="close-circle" size={19} />
        </AnimatedPressable>
        {onFilterPress ? (
          <Pressable
            accessibilityLabel={filterLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: filterActive }}
            hitSlop={8}
            onPress={onFilterPress}
            style={({ pressed }) => [
              styles.filterButton,
              filterActive && styles.filterButtonActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              color={filterActive ? colors.white : colors.ink}
              name="options-outline"
              size={18}
            />
          </Pressable>
        ) : null}
      </Animated.View>

      <Animated.View pointerEvents={focused ? 'auto' : 'none'} style={[styles.cancel, cancelStyle]}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={cancel}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.cancelText}>{cancelLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { minHeight: 54, position: 'relative', width: '100%' },
  field: {
    alignItems: 'center',
    backgroundColor: 'rgba(251,253,251,0.82)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 52,
    overflow: 'hidden',
    paddingHorizontal: 15,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 15,
    minHeight: 50,
    paddingVertical: 0,
  },
  clearButton: { alignItems: 'center', justifyContent: 'center' },
  filterButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    marginRight: -6,
    width: 34,
  },
  filterButtonActive: { backgroundColor: colors.emerald },
  cancel: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 52,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 66,
  },
  cancelText: {
    color: colors.emerald,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 13,
  },
  pressed: { opacity: 0.58 },
})
