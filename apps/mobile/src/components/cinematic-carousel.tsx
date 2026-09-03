import { BlurView, type BlurViewProps } from 'expo-blur'
import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView)

export interface CinematicCarouselProps<ItemT> {
  data: readonly ItemT[]
  height?: number
  renderItem: (info: { item: ItemT; index: number }) => ReactNode
  keyExtractor?: (item: ItemT, index: number) => string
  itemWidth?: number
  onIndexChange?: (index: number) => void
  spacing?: number
}

interface CinematicCarouselItemProps<ItemT> {
  index: number
  height: number
  item: ItemT
  itemWidth: number
  renderItem: CinematicCarouselProps<ItemT>['renderItem']
  scrollX: SharedValue<number>
  spacing: number
}

function CarouselItem<ItemT>({
  index,
  height,
  item,
  itemWidth,
  renderItem,
  scrollX,
  spacing,
}: CinematicCarouselItemProps<ItemT>) {
  const interval = itemWidth + spacing
  const inputRange = [(index - 1) * interval, index * interval, (index + 1) * interval]

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollX.value, inputRange, [0.86, 1, 0.86], Extrapolation.CLAMP)
    const opacity = interpolate(scrollX.value, inputRange, [0.58, 1, 0.58], Extrapolation.CLAMP)
    const rotateY = interpolate(scrollX.value, inputRange, [34, 0, -34], Extrapolation.CLAMP)
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [spacing * 0.8, 0, spacing * -0.8],
      Extrapolation.CLAMP,
    )

    return {
      opacity,
      transform: [{ perspective: 720 }, { translateX }, { rotateY: `${rotateY}deg` }, { scale }],
    }
  })

  const veilStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0.26, 0, 0.26], Extrapolation.CLAMP),
  }))

  const animatedBlurProps = useAnimatedProps<BlurViewProps>(() => ({
    intensity: interpolate(scrollX.value, inputRange, [22, 0, 22], Extrapolation.CLAMP),
  }))

  return (
    <Animated.View
      style={[
        styles.itemContainer,
        { height, marginRight: spacing, width: itemWidth },
        animatedStyle,
      ]}
    >
      <View style={styles.contentWrapper}>
        {renderItem({ item, index })}
        <AnimatedBlurView
          animatedProps={animatedBlurProps}
          intensity={0}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          tint="dark"
        />
        <Animated.View pointerEvents="none" style={[styles.veil, veilStyle]} />
      </View>
    </Animated.View>
  )
}

export function CinematicCarousel<ItemT>({
  data,
  height = 330,
  itemWidth: requestedItemWidth,
  keyExtractor,
  onIndexChange,
  renderItem,
  spacing = 14,
}: CinematicCarouselProps<ItemT>) {
  const { width: screenWidth } = useWindowDimensions()
  const itemWidth = requestedItemWidth ?? Math.min(screenWidth * 0.78, 390)
  const interval = itemWidth + spacing
  const horizontalSpacing = Math.max((screenWidth - itemWidth) / 2, 0)
  const scrollX = useSharedValue(0)
  const listData = useMemo(() => [...data], [data])

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x
    },
  })

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.max(
        0,
        Math.min(data.length - 1, Math.round(event.nativeEvent.contentOffset.x / interval)),
      )
      onIndexChange?.(nextIndex)
    },
    [data.length, interval, onIndexChange],
  )

  return (
    <Animated.FlatList
      contentContainerStyle={{ paddingHorizontal: horizontalSpacing }}
      data={listData}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({ index, length: interval, offset: interval * index })}
      horizontal
      keyExtractor={(item, index) => keyExtractor?.(item as ItemT, index) ?? String(index)}
      onMomentumScrollEnd={handleMomentumEnd}
      onScroll={onScroll}
      renderItem={({ item, index }) => (
        <CarouselItem
          height={height}
          index={index}
          item={item as ItemT}
          itemWidth={itemWidth}
          renderItem={renderItem}
          scrollX={scrollX}
          spacing={spacing}
        />
      )}
      scrollEventThrottle={16}
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={interval}
      style={[styles.list, { height }]}
    />
  )
}

const styles = StyleSheet.create({
  list: { flexGrow: 0, overflow: 'visible' },
  itemContainer: { alignItems: 'center', justifyContent: 'center' },
  contentWrapper: { borderRadius: 28, flex: 1, overflow: 'hidden', width: '100%' },
  veil: {
    backgroundColor: '#071d17',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
