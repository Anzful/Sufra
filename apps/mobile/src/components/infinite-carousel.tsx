import type { PropsWithChildren, ReactNode } from 'react'
import { useCallback, useEffect, useMemo } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

export interface InfiniteCarouselProps<ItemT> {
  autoPlaySpeed?: number
  data: readonly ItemT[]
  height?: number
  itemWidthRatio?: number
  keyExtractor?: (item: ItemT, index: number) => string
  onIndexChange?: (index: number) => void
  renderItem: (info: { item: ItemT; index: number }) => ReactNode
  rotateDeg?: number
}

interface CarouselItemProps extends PropsWithChildren {
  containerWidth: number
  index: number
  itemCount: number
  itemWidth: number
  rotateDeg: number
  screenWidth: number
  scroll: SharedValue<number>
}

function positiveModulo(value: number, divisor: number) {
  'worklet'
  return ((value % divisor) + divisor) % divisor
}

function CarouselItem({
  children,
  containerWidth,
  index,
  itemCount,
  itemWidth,
  rotateDeg,
  screenWidth,
  scroll,
}: CarouselItemProps) {
  const sideSpacing = (screenWidth - itemWidth) / 2

  const animatedStyle = useAnimatedStyle(() => {
    if (itemCount === 1) {
      return { left: sideSpacing, opacity: 1, transform: [{ scale: 1 }] }
    }

    const rawLeft = index * itemWidth - scroll.value + sideSpacing
    const left = positiveModulo(rawLeft + itemWidth, containerWidth) - itemWidth
    const distance = (left + itemWidth / 2 - screenWidth / 2) / itemWidth
    const clampedDistance = Math.max(-1, Math.min(1, distance))
    const scale = interpolate(
      clampedDistance,
      [-1, 0, 1],
      [0.94, 1, 0.94],
      Extrapolation.CLAMP,
    )
    const opacity = interpolate(
      clampedDistance,
      [-1, 0, 1],
      [0.66, 1, 0.66],
      Extrapolation.CLAMP,
    )
    const translateY = interpolate(
      clampedDistance,
      [-1, 0, 1],
      [8, 0, 8],
      Extrapolation.CLAMP,
    )
    const rotateZ = interpolate(
      clampedDistance,
      [-1, 0, 1],
      [-rotateDeg, 0, rotateDeg],
      Extrapolation.CLAMP,
    )

    return {
      left,
      opacity,
      transform: [{ translateY }, { rotateZ: `${rotateZ}deg` }, { scale }],
      zIndex: Math.round(20 - Math.abs(distance) * 10),
    }
  })

  return (
    <Animated.View style={[styles.item, { width: itemWidth }, animatedStyle]}>
      {children}
    </Animated.View>
  )
}

export function InfiniteCarousel<ItemT>({
  autoPlaySpeed = 30,
  data,
  height = 326,
  itemWidthRatio = 0.69,
  keyExtractor,
  onIndexChange,
  renderItem,
  rotateDeg = 2.4,
}: InfiniteCarouselProps<ItemT>) {
  const { width: screenWidth } = useWindowDimensions()
  const reduceMotion = useReducedMotion()
  const itemWidth = Math.min(screenWidth * itemWidthRatio, 370)
  const containerWidth = Math.max(itemWidth * data.length, itemWidth)
  const scroll = useSharedValue(0)
  const speed = useSharedValue(reduceMotion ? 0 : autoPlaySpeed)
  const resumeSpeed = reduceMotion ? 0 : autoPlaySpeed

  useEffect(() => {
    speed.value = withTiming(resumeSpeed, { duration: 300 })
  }, [resumeSpeed, speed])

  const reportIndex = useCallback(
    (index: number) => {
      onIndexChange?.(index)
    },
    [onIndexChange],
  )

  useAnimatedReaction(
    () => {
      if (data.length < 2) return 0
      const normalized = positiveModulo(scroll.value, containerWidth)
      return Math.round(normalized / itemWidth) % data.length
    },
    (nextIndex, previousIndex) => {
      if (nextIndex !== previousIndex) runOnJS(reportIndex)(nextIndex)
    },
    [containerWidth, data.length, itemWidth, reportIndex],
  )

  useFrameCallback((frame) => {
    if (data.length < 2 || speed.value === 0) return
    const elapsed = (frame.timeSincePreviousFrame ?? 0) / 1000
    scroll.value = positiveModulo(scroll.value + speed.value * elapsed, containerWidth)
  })

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(data.length > 1)
        .onBegin(() => {
          speed.value = 0
        })
        .onChange((event) => {
          scroll.value = positiveModulo(scroll.value - event.changeX, containerWidth)
        })
        .onFinalize(() => {
          speed.value = withTiming(resumeSpeed, {
            duration: 900,
            easing: Easing.out(Easing.cubic),
          })
        }),
    [containerWidth, data.length, resumeSpeed, scroll, speed],
  )

  if (data.length === 0) return null

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.container, { height }]}>
        {data.map((item, index) => (
          <CarouselItem
            containerWidth={containerWidth}
            index={index}
            itemCount={data.length}
            itemWidth={itemWidth}
            key={keyExtractor?.(item, index) ?? String(index)}
            rotateDeg={rotateDeg}
            screenWidth={screenWidth}
            scroll={scroll}
          >
            {renderItem({ item, index })}
          </CarouselItem>
        ))}
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', width: '100%' },
  item: {
    height: '100%',
    paddingHorizontal: 7,
    position: 'absolute',
    top: 0,
  },
})
