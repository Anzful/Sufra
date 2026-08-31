import type { PropsWithChildren, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, type ViewStyle, View } from 'react-native'

import { AuroraField, type AuroraTone } from '@/components/aurora-field'
import { colors } from '@/lib/colors'

export function AuroraBackdrop({
  children,
  tone = 'light',
}: PropsWithChildren<{ tone?: AuroraTone }>) {
  return (
    <View style={[styles.backdrop, tone === 'dark' && styles.backdropDark]}>
      <AuroraField tone={tone} />
      {children}
    </View>
  )
}

export function AuroraSurface({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle | ViewStyle[] }>) {
  return <View style={[styles.surface, style]}>{children}</View>
}

export function ShockwaveReveal({
  children,
  origin,
  style,
}: PropsWithChildren<{ origin?: ReactNode; style?: ViewStyle | ViewStyle[] }>) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.timing(progress, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [progress])

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.14, 1], outputRange: [0, 0.72, 1] }),
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [0.94, 1.012, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
      <View pointerEvents="none" style={styles.waveOrigin}>
        <Animated.View
          style={[
            styles.wave,
            {
              opacity: progress.interpolate({
                inputRange: [0, 0.08, 0.6, 1],
                outputRange: [0, 0.7, 0.22, 0],
              }),
              transform: [
                {
                  scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.08, 4.8] }),
                },
              ],
            },
          ]}
        />
        {origin}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.paper, flex: 1, overflow: 'hidden' },
  backdropDark: { backgroundColor: colors.emeraldBlack },
  surface: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(255,255,255,0.96)',
    borderRadius: 26,
    borderWidth: 1,
  },
  waveOrigin: {
    alignItems: 'center',
    height: 1,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    top: '48%',
    width: 1,
  },
  wave: {
    borderColor: 'rgba(200,231,124,0.9)',
    borderRadius: 80,
    borderWidth: 1.5,
    height: 80,
    position: 'absolute',
    width: 80,
  },
})
