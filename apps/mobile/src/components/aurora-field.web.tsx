import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

export type AuroraTone = 'dark' | 'light'

interface AuroraFieldProps {
  tone: AuroraTone
}

const palette = {
  dark: {
    background: ['#071b16', '#020706'] as const,
    glowA: '#20e3a1',
    glowB: '#54efe0',
  },
  light: {
    background: ['#e6f5ed', '#f7faf8'] as const,
    glowA: '#a0ead0',
    glowB: '#b8ece8',
  },
} as const

export function AuroraField({ tone }: AuroraFieldProps) {
  const drift = useRef(new Animated.Value(0)).current
  const colors = palette[tone]

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [drift])

  return (
    <View pointerEvents="none" style={styles.fill}>
      <LinearGradient colors={[...colors.background]} style={StyleSheet.absoluteFill} />
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: colors.glowA,
            transform: [
              {
                translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-50, 80] }),
              },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glow,
          styles.glowSecond,
          {
            backgroundColor: colors.glowB,
            transform: [
              {
                translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [90, -70] }),
              },
            ],
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { bottom: 0, left: 0, overflow: 'hidden', position: 'absolute', right: 0, top: 0 },
  glow: {
    borderRadius: 300,
    height: 380,
    left: -70,
    opacity: 0.42,
    position: 'absolute',
    top: -170,
    width: 380,
  },
  glowSecond: { left: undefined, right: -80, top: -120 },
})
