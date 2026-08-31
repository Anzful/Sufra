import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { colors } from '@/lib/colors'
import { fontFamilyFor } from '@/lib/theme'

export interface AnimatedProgressProps {
  value?: number
  label?: string
  valueLabel?: string
  formatValue?: (value: number) => string
  height?: number
  indeterminate?: boolean
  style?: StyleProp<ViewStyle>
  valueStyle?: StyleProp<TextStyle>
}

const progressGradient = [colors.emerald, colors.mint, colors.aqua] as const

export function AnimatedProgress({
  value = 0,
  label,
  valueLabel,
  formatValue = (currentValue) => `${Math.round(currentValue * 100)}%`,
  height = 8,
  indeterminate = false,
  style,
  valueStyle,
}: AnimatedProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 1)
  const animatedValue = useSharedValue(0)
  const sweep = useSharedValue(0)

  useEffect(() => {
    if (indeterminate) {
      cancelAnimation(animatedValue)
      sweep.value = 0
      sweep.value = withRepeat(
        withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.quad) }),
        -1,
        false,
      )
      return () => cancelAnimation(sweep)
    }

    cancelAnimation(sweep)
    animatedValue.value = withTiming(clampedValue, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    })
    return undefined
  }, [animatedValue, clampedValue, indeterminate, sweep])

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedValue.value * 100}%`,
  }))

  const sweepStyle = useAnimatedStyle(() => ({
    left: `${interpolate(sweep.value, [0, 1], [-36, 100])}%`,
  }))

  const displayValue = valueLabel ?? (indeterminate ? '' : formatValue(clampedValue))

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={
        indeterminate ? undefined : { max: 100, min: 0, now: Math.round(clampedValue * 100) }
      }
      style={style}
    >
      {label || displayValue ? (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          <Text style={[styles.value, valueStyle]}>{displayValue}</Text>
        </View>
      ) : null}
      <View style={[styles.track, { borderRadius: height / 2, height }]}>
        {indeterminate ? (
          <Animated.View style={[styles.sweep, { borderRadius: height / 2, height }, sweepStyle]}>
            <LinearGradient
              colors={progressGradient}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.fill, { borderRadius: height / 2, height }, fillStyle]}>
            <LinearGradient
              colors={progressGradient}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.highlight} />
          </Animated.View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  label: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 9,
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.emeraldDark,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 11,
  },
  track: {
    backgroundColor: colors.line,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  fill: { overflow: 'hidden' },
  highlight: {
    backgroundColor: 'rgba(255,255,255,0.34)',
    height: 1,
    left: 5,
    position: 'absolute',
    right: 5,
    top: 1,
  },
  sweep: { overflow: 'hidden', position: 'absolute', width: '36%' },
})
