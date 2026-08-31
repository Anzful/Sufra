import { StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { colors } from '@/lib/colors'
import { fontFamilyFor } from '@/lib/theme'

export interface SufraBrandProps {
  inverted?: boolean
  size?: 'compact' | 'regular'
}

export function SufraBrand({ inverted = false, size = 'regular' }: SufraBrandProps) {
  const color = inverted ? colors.white : colors.emeraldBlack
  const compact = size === 'compact'
  const markSize = compact ? 27 : 31

  return (
    <View accessibilityLabel="სუფრა" style={styles.root}>
      <Svg accessibilityElementsHidden height={markSize} viewBox="0 0 32 32" width={markSize}>
        <Path
          d="M5 18.5h22M7.3 18.3c.5-6.2 3.8-9.3 8.7-9.3s8.2 3.1 8.7 9.3M3.8 22h24.4v3.2H3.8zM16 9V6.7M13.6 6.7h4.8"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </Svg>
      <Text
        style={[
          styles.wordmark,
          { color },
          compact ? styles.wordmarkCompact : styles.wordmarkRegular,
        ]}
      >
        სუფრა
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  wordmark: { fontFamily: fontFamilyFor('serif', 600) },
  wordmarkCompact: { fontSize: 20, lineHeight: 27 },
  wordmarkRegular: { fontSize: 24, lineHeight: 31 },
})
