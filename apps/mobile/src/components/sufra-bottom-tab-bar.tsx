import { LinearGradient } from 'expo-linear-gradient'
import { Tabs } from 'expo-router'
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { Keyboard, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '@/lib/colors'
import { fontFamilyFor, shadow } from '@/lib/theme'

const horizontalMargin = 12
const barHeight = 78
const curveTop = 14
const notchDepth = 34

type ExpoTabsProps = ComponentProps<typeof Tabs>
type SufraBottomTabBarProps = Parameters<NonNullable<ExpoTabsProps['tabBar']>>[0]

interface TabItemProps {
  badge?: number
  focused: boolean
  icon: ReactNode
  label: string
  onLongPress: () => void
  onPress: () => void
}

function TabItem({ badge, focused, icon, label, onLongPress, onPress }: TabItemProps) {
  const lift = useSharedValue(focused ? 1 : 0)

  useEffect(() => {
    lift.value = withSpring(focused ? 1 : 0, { damping: 16, mass: 0.7, stiffness: 180 })
  }, [focused, lift])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value * -22 }, { scale: 1 + lift.value * 0.04 }],
  }))

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.tabVisual, animatedStyle]}>
        {focused ? (
          <LinearGradient
            colors={[colors.emerald, colors.emeraldDark]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.activeButton}
          >
            {icon}
            {badge ? <TabBadge value={badge} floating /> : null}
          </LinearGradient>
        ) : (
          <>
            <View style={styles.inactiveIcon}>
              {icon}
              {badge ? <TabBadge value={badge} /> : null}
            </View>
            <Text numberOfLines={1} style={styles.label}>
              {label}
            </Text>
          </>
        )}
      </Animated.View>
    </Pressable>
  )
}

function TabBadge({ value, floating = false }: { value: number; floating?: boolean }) {
  return (
    <View style={[styles.badge, floating && styles.badgeFloating]}>
      <Text style={styles.badgeText}>{value > 99 ? '99+' : value}</Text>
    </View>
  )
}

function CurvedBarBackground({ activeIndex, tabCount }: { activeIndex: number; tabCount: number }) {
  const { width: screenWidth } = useWindowDimensions()
  const width = screenWidth - horizontalMargin * 2
  const totalWidth = width * 3
  const tabWidth = width / tabCount
  const center = width * 1.5
  const curvePosition = useSharedValue(activeIndex * tabWidth + tabWidth / 2 - center)

  useEffect(() => {
    curvePosition.value = withSpring(activeIndex * tabWidth + tabWidth / 2 - center, {
      damping: 18,
      mass: 0.75,
      stiffness: 170,
    })
  }, [activeIndex, center, curvePosition, tabWidth])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: curvePosition.value }],
  }))

  const notchHalfWidth = Math.min(42, tabWidth * 0.42)
  const shoulder = notchHalfWidth + 18
  const path = [
    `M 0 ${curveTop}`,
    `H ${center - shoulder}`,
    `C ${center - notchHalfWidth} ${curveTop} ${center - notchHalfWidth} ${notchDepth} ${center} ${notchDepth}`,
    `C ${center + notchHalfWidth} ${notchDepth} ${center + notchHalfWidth} ${curveTop} ${center + shoulder} ${curveTop}`,
    `H ${totalWidth}`,
    `V ${barHeight}`,
    'H 0',
    'Z',
  ].join(' ')

  return (
    <View pointerEvents="none" style={[styles.curveWindow, { width }]}>
      <Animated.View style={[styles.curveTrack, animatedStyle]}>
        <Svg
          height={barHeight}
          style={styles.curveSvg}
          viewBox={`0 0 ${totalWidth} ${barHeight}`}
          width={totalWidth}
        >
          <Defs>
            <SvgGradient id="sufraBarGradient" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={colors.white} />
              <Stop offset="1" stopColor={colors.surface} />
            </SvgGradient>
          </Defs>
          <Path d={path} fill="url(#sufraBarGradient)" stroke={colors.line} strokeWidth={1} />
        </Svg>
      </Animated.View>
    </View>
  )
}

export function SufraBottomTabBar({
  state,
  descriptors,
  navigation,
}: SufraBottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true))
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    )
    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  if (keyboardVisible) return null

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { height: barHeight + Math.max(insets.bottom, 8) }]}
    >
      <View style={[styles.barShadow, { bottom: Math.max(insets.bottom, 8) - 8 }]}>
        <CurvedBarBackground activeIndex={state.index} tabCount={state.routes.length} />
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key]
            if (!descriptor) return null
            const { options } = descriptor
            const focused = state.index === index
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options.title === 'string'
                  ? options.title
                  : route.name
            const badge = typeof options.tabBarBadge === 'number' ? options.tabBarBadge : undefined
            const icon = options.tabBarIcon?.({
              color: focused ? colors.white : colors.muted,
              focused,
              size: focused ? 23 : 20,
            })

            const onPress = () => {
              const event = navigation.emit({
                canPreventDefault: true,
                target: route.key,
                type: 'tabPress',
              })
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params)
              }
            }

            const onLongPress = () => {
              navigation.emit({ target: route.key, type: 'tabLongPress' })
            }

            return (
              <TabItem
                {...(badge === undefined ? {} : { badge })}
                focused={focused}
                icon={icon}
                key={route.key}
                label={label}
                onLongPress={onLongPress}
                onPress={onPress}
              />
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: 'transparent', paddingHorizontal: horizontalMargin },
  barShadow: {
    height: barHeight,
    left: horizontalMargin,
    position: 'absolute',
    right: horizontalMargin,
    ...shadow(2),
  },
  curveWindow: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: barHeight,
    overflow: 'hidden',
    position: 'absolute',
  },
  curveTrack: { height: barHeight, left: 0, position: 'absolute', top: 0 },
  curveSvg: { left: 0, position: 'absolute', top: 0 },
  tabsRow: {
    flexDirection: 'row',
    height: barHeight,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tabPressable: { alignItems: 'center', flex: 1, justifyContent: 'flex-start' },
  tabVisual: { alignItems: 'center', minHeight: 66, paddingTop: 25 },
  activeButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 28,
    borderWidth: 3,
    height: 56,
    justifyContent: 'center',
    width: 56,
    ...shadow(2),
  },
  inactiveIcon: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  label: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 8,
    marginTop: 4,
    maxWidth: 72,
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderColor: colors.white,
    borderRadius: 9,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -12,
    top: -8,
  },
  badgeFloating: { right: -6, top: -6 },
  badgeText: {
    color: colors.white,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 8,
  },
})
