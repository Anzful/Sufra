import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { colors } from '@/lib/colors'
import { fontFamilyFor, shadow } from '@/lib/theme'

interface SufraWelcomeButtonProps {
  busy?: boolean
  label: string
  onPress: () => void
  variant?: 'accent' | 'primary'
}

export function SufraWelcomeButton({
  busy = false,
  label,
  onPress,
  variant = 'primary',
}: SufraWelcomeButtonProps) {
  const scale = useSharedValue(1)
  const accent = variant === 'accent'
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={[styles.wrapper, shadow(accent ? 1 : 2), animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 110 })
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 180 })
        }}
        style={styles.pressable}
      >
        {accent ? (
          <LinearGradient
            colors={['#d7ef62', '#c9e35d', '#d8eb75']}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={styles.surface}
          >
            {busy ? (
              <ActivityIndicator color={colors.emeraldDark} />
            ) : (
              <ButtonContent accent label={label} />
            )}
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={[colors.emeraldBlack, colors.emeraldDark, '#004b36']}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={styles.surface}
          >
            {busy ? <ActivityIndicator color={colors.white} /> : <ButtonContent label={label} />}
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  )
}

function ButtonContent({ accent = false, label }: { accent?: boolean; label: string }) {
  const color = accent ? colors.emeraldDark : colors.white

  return (
    <View style={styles.content}>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {accent ? null : (
        <View style={styles.icon}>
          <Ionicons color={color} name="arrow-forward" size={19} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 28, width: '100%' },
  pressable: { borderRadius: 28, overflow: 'hidden' },
  surface: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 15,
    letterSpacing: -0.1,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 2,
    width: 36,
  },
})
