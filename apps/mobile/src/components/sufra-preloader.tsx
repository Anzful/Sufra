import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { memo, useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

import { AnimatedProgress } from '@/components/animated-progress'
import { AuroraField } from '@/components/aurora-field'
import { colors } from '@/lib/colors'
import { fontFamilyFor, shadow } from '@/lib/theme'

export interface SufraPreloaderProps {
  message: string
  presentation?: 'overlay' | 'screen'
}

interface IngredientProps {
  kind: 'herb' | 'lime' | 'tomato'
  order: 0 | 1 | 2
  progress: SharedValue<number>
}

function Ingredient({ kind, order, progress }: IngredientProps) {
  const positionStyle = [styles.ingredient0, styles.ingredient1, styles.ingredient2][order]
  const animatedStyle = useAnimatedStyle(() => {
    const start = order * 0.22
    const end = start + 0.28
    const localProgress = interpolate(progress.value, [start, end], [0, 1], Extrapolation.CLAMP)

    return {
      opacity: interpolate(localProgress, [0, 0.08, 0.78, 1], [0, 1, 1, 0]),
      transform: [
        { translateY: interpolate(localProgress, [0, 0.82, 1], [-62, 5, 12]) },
        { rotateZ: `${interpolate(localProgress, [0, 1], [-12, 9])}deg` },
        { scale: interpolate(localProgress, [0, 0.72, 1], [0.74, 1.08, 0.88]) },
      ],
    }
  })

  return (
    <Animated.View
      accessibilityElementsHidden
      style={[
        styles.ingredient,
        positionStyle,
        kind === 'tomato' && styles.tomato,
        kind === 'lime' && styles.lime,
        kind === 'herb' && styles.herb,
        animatedStyle,
      ]}
    >
      {kind === 'tomato' ? <View style={styles.tomatoLeaf} /> : null}
      {kind === 'lime' ? <View style={styles.limeCore} /> : null}
      {kind === 'herb' ? <View style={styles.herbVein} /> : null}
    </Animated.View>
  )
}

function SufraPreloaderView({ message, presentation = 'screen' }: SufraPreloaderProps) {
  const reduceMotion = useReducedMotion()
  const progress = useSharedValue(reduceMotion ? 0.72 : 0)
  const basketRock = useSharedValue(0)
  const glow = useSharedValue(reduceMotion ? 1 : 0.86)

  useEffect(() => {
    if (reduceMotion) return undefined

    progress.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 860, easing: Easing.linear }),
        withTiming(0.92, { duration: 240 }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    )
    basketRock.value = withRepeat(
      withSequence(
        withTiming(-1, { duration: 540, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 760, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 540, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    )
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 980, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.86, { duration: 980, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    )

    return () => {
      cancelAnimation(progress)
      cancelAnimation(basketRock)
      cancelAnimation(glow)
    }
  }, [basketRock, glow, progress, reduceMotion])

  const basketStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateZ: `${basketRock.value * 1.8}deg` },
      { translateY: Math.abs(basketRock.value) * 1.5 },
    ],
  }))

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0.86, 1], [0.35, 0.7]),
    transform: [{ scale: glow.value }],
  }))

  const checkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.73, 0.82, 0.98, 1], [0, 0, 1, 1, 0]),
    transform: [
      { scale: interpolate(progress.value, [0.73, 0.82, 1], [0.5, 1, 0.88], Extrapolation.CLAMP) },
    ],
  }))

  return (
    <View
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={[styles.root, presentation === 'overlay' && styles.overlay]}
    >
      <StatusBar style="light" />
      <AuroraField tone="dark" />
      <LinearGradient
        colors={['rgba(2,26,19,0.02)', 'rgba(1,13,10,0.68)', 'rgba(1,10,8,0.9)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.markWrap}>
          <View style={styles.markLine} />
          <Text style={styles.brand}>სუფრა</Text>
          <View style={styles.markLine} />
        </View>

        <View style={styles.motionStage}>
          <Animated.View style={[styles.glow, glowStyle]} />
          <View style={[styles.orbit, shadow(2)]}>
            <Ingredient kind="tomato" order={0} progress={progress} />
            <Ingredient kind="herb" order={1} progress={progress} />
            <Ingredient kind="lime" order={2} progress={progress} />
            <Animated.View style={[styles.basket, basketStyle]}>
              <Ionicons color="#f7fbf7" name="basket-outline" size={72} />
              <Animated.View style={[styles.check, checkStyle]}>
                <Ionicons color={colors.emeraldBlack} name="checkmark" size={19} />
              </Animated.View>
            </Animated.View>
          </View>
        </View>

        <Text style={styles.message}>{message}</Text>
        {reduceMotion ? (
          <AnimatedProgress height={3} style={styles.progress} value={0.68} />
        ) : (
          <AnimatedProgress height={3} indeterminate style={styles.progress} />
        )}
      </View>
    </View>
  )
}

export const SufraPreloader = memo(SufraPreloaderView)

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: colors.emeraldBlack,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    elevation: 40,
    zIndex: 100,
  },
  content: { alignItems: 'center', paddingBottom: 8, width: '100%' },
  markWrap: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  markLine: { backgroundColor: 'rgba(200,231,124,0.5)', height: 1, width: 30 },
  brand: {
    color: colors.white,
    fontFamily: fontFamilyFor('serif', 500),
    fontSize: 31,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  motionStage: { alignItems: 'center', height: 208, justifyContent: 'center', marginTop: 15 },
  glow: {
    backgroundColor: '#45d5a0',
    borderRadius: 82,
    height: 164,
    position: 'absolute',
    width: 164,
  },
  orbit: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,52,39,0.62)',
    borderColor: 'rgba(213,243,229,0.25)',
    borderRadius: 75,
    borderWidth: 1,
    height: 150,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 150,
  },
  basket: {
    alignItems: 'center',
    height: 82,
    justifyContent: 'center',
    marginTop: 35,
    width: 88,
  },
  check: {
    alignItems: 'center',
    backgroundColor: colors.lime,
    borderColor: 'rgba(255,255,255,0.68)',
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    top: 5,
    width: 30,
  },
  ingredient: { position: 'absolute', top: 40 },
  ingredient0: { left: 42 },
  ingredient1: { left: 68 },
  ingredient2: { right: 39 },
  tomato: {
    backgroundColor: '#d56a55',
    borderColor: 'rgba(255,255,255,0.54)',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    width: 20,
  },
  tomatoLeaf: {
    backgroundColor: colors.lime,
    borderRadius: 3,
    height: 5,
    left: 7,
    position: 'absolute',
    top: -3,
    transform: [{ rotateZ: '28deg' }],
    width: 7,
  },
  lime: {
    backgroundColor: '#d5ed73',
    borderColor: 'rgba(255,255,255,0.52)',
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  limeCore: {
    borderColor: 'rgba(8,45,35,0.42)',
    borderRadius: 5,
    borderWidth: 1,
    height: 10,
    left: 3,
    position: 'absolute',
    top: 3,
    width: 10,
  },
  herb: {
    backgroundColor: '#78cda5',
    borderColor: 'rgba(255,255,255,0.5)',
    borderBottomLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 1,
    height: 21,
    transform: [{ rotateZ: '-28deg' }],
    width: 13,
  },
  herbVein: {
    backgroundColor: 'rgba(8,45,35,0.46)',
    height: 15,
    left: 5,
    position: 'absolute',
    top: 2,
    transform: [{ rotateZ: '2deg' }],
    width: 1,
  },
  message: {
    color: 'rgba(244,251,247,0.82)',
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 14,
    letterSpacing: 0.1,
    lineHeight: 21,
    marginTop: 1,
    textAlign: 'center',
  },
  progress: { marginTop: 24, width: 142 },
})
