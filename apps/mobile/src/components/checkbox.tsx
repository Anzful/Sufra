import { memo, useEffect } from 'react'
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { G, Path, Svg, type GProps, type PathProps } from 'react-native-svg'

import { colors } from '@/lib/colors'

const PADDING = 5
const VIEWPORT_SIZE = 74
const TICK_LENGTH = 34
const TICK_PATH = 'M20 32L28 40L44 24'
const BOX_PATH =
  'M24 0.5H40C48.5809 0.5 54.4147 2.18067 58.117 5.88299C61.8193 9.58532 63.5 15.4191 63.5 24V40C63.5 48.5809 61.8193 54.4147 58.117 58.117C54.4147 61.8193 48.5809 63.5 40 63.5H24C15.4191 63.5 9.58532 61.8193 5.88299 58.117C2.18067 54.4147 0.5 48.5809 0.5 40V24C0.5 15.4191 2.18067 9.58532 5.88299 5.88299C9.58532 2.18067 15.4191 0.5 24 0.5Z'

const AnimatedPath = Animated.createAnimatedComponent(Path)
const AnimatedGroup = Animated.createAnimatedComponent(G)

export interface CheckboxProps {
  checked: boolean
  checkedColor?: string
  checkmarkColor?: string
  size?: number
  uncheckedColor?: string
}

function CheckboxView({
  checked,
  checkedColor = colors.emerald,
  checkmarkColor = colors.white,
  size = 24,
  uncheckedColor = colors.lineStrong,
}: CheckboxProps) {
  const reduceMotion = useReducedMotion()
  const progress = useSharedValue(checked ? 1 : 0)
  const scale = useSharedValue(1)

  useEffect(() => {
    const duration = reduceMotion ? 0 : checked ? 280 : 210
    progress.value = withTiming(checked ? 1 : 0, {
      duration,
      easing: checked ? Easing.out(Easing.cubic) : Easing.inOut(Easing.quad),
    })

    if (!reduceMotion && checked) {
      scale.value = 0.82
      scale.value = withSpring(1, { damping: 11, mass: 0.45, stiffness: 180 })
    }
  }, [checked, progress, reduceMotion, scale])

  const fillProps = useAnimatedProps<Pick<PathProps, 'fillOpacity' | 'strokeOpacity'>>(() => ({
    fillOpacity: progress.value,
    strokeOpacity: progress.value,
  }))

  const tickProps = useAnimatedProps<Pick<PathProps, 'opacity' | 'strokeDashoffset'>>(() => ({
    opacity: interpolate(progress.value, [0, 0.08, 1], [0, 1, 1]),
    strokeDashoffset: TICK_LENGTH * (1 - progress.value),
  }))

  const groupProps = useAnimatedProps<Pick<GProps, 'transform'>>(() => ({
    transform: [
      { translateX: 32 },
      { translateY: 32 },
      { scale: scale.value },
      { translateX: -32 },
      { translateY: -32 },
    ],
  }))

  return (
    <Svg
      accessibilityElementsHidden
      height={size}
      pointerEvents="none"
      viewBox={`${-PADDING} ${-PADDING} ${VIEWPORT_SIZE} ${VIEWPORT_SIZE}`}
      width={size}
    >
      <Path
        d={BOX_PATH}
        fill="none"
        stroke={uncheckedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
      <AnimatedPath
        animatedProps={fillProps}
        d={BOX_PATH}
        fill={checkedColor}
        stroke={checkedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
      <AnimatedGroup animatedProps={groupProps}>
        <AnimatedPath
          animatedProps={tickProps}
          d={TICK_PATH}
          fill="none"
          stroke={checkmarkColor}
          strokeDasharray={TICK_LENGTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={5}
        />
      </AnimatedGroup>
    </Svg>
  )
}

export const Checkbox = memo(CheckboxView)
