import { memo, useEffect, useRef, type PropsWithChildren } from 'react'
import {
  Animated,
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from 'react-native'

import { colors } from '@/lib/colors'
import { typeStyle } from '@/lib/theme'

type TitleLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
type TitleTone = 'default' | 'inverted' | 'accent' | 'muted'

export interface TitleProps extends PropsWithChildren, Omit<TextProps, 'children' | 'style'> {
  animated?: boolean
  animationDuration?: number
  level?: TitleLevel
  style?: StyleProp<TextStyle>
  tone?: TitleTone
}

const levelStyles: Record<TitleLevel, TextStyle> = {
  h1: typeStyle('displayL'),
  h2: typeStyle('displayM'),
  h3: typeStyle('titleL'),
  h4: typeStyle('titleM'),
  h5: typeStyle('bodyL'),
  h6: typeStyle('bodyM'),
}

const toneColors: Record<TitleTone, string> = {
  accent: colors.emerald,
  default: colors.ink,
  inverted: colors.white,
  muted: colors.muted,
}

function TitleText({
  animated = false,
  animationDuration = 320,
  children,
  level = 'h1',
  style,
  tone = 'default',
  ...textProps
}: TitleProps) {
  const opacity = useRef(new Animated.Value(animated ? 0 : 1)).current
  const translateY = useRef(new Animated.Value(animated ? 6 : 0)).current

  useEffect(() => {
    if (!animated) return
    const entrance = Animated.parallel([
      Animated.timing(opacity, {
        duration: animationDuration,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: animationDuration,
        toValue: 0,
        useNativeDriver: true,
      }),
    ])
    entrance.start()
    return () => entrance.stop()
  }, [animated, animationDuration, opacity, translateY])

  const titleStyle = [styles.base, levelStyles[level], { color: toneColors[tone] }, style]

  if (animated) {
    return (
      <Animated.Text {...textProps} style={[titleStyle, { opacity, transform: [{ translateY }] }]}>
        {children}
      </Animated.Text>
    )
  }

  return (
    <Text {...textProps} style={titleStyle}>
      {children}
    </Text>
  )
}

function heading(level: TitleLevel) {
  return memo(function Heading(props: Omit<TitleProps, 'level'>) {
    return <TitleText {...props} level={level} />
  })
}

export const Title = Object.assign(memo(TitleText), {
  H1: heading('h1'),
  H2: heading('h2'),
  H3: heading('h3'),
  H4: heading('h4'),
  H5: heading('h5'),
  H6: heading('h6'),
})

const styles = StyleSheet.create({
  base: { flexShrink: 1 },
})
