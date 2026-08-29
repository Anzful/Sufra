import { Tabs } from 'expo-router'
import { Text } from 'react-native'

import { colors } from '@/lib/colors'
import { useLocale } from '@/providers/locale-provider'

export default function TabsLayout() {
  const { locale } = useLocale()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.wine,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.line,
          height: 82,
          paddingBottom: 22,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="plan"
        options={{
          title: locale === 'ka' ? 'გეგმა' : 'Plan',
          tabBarIcon: ({ color }) => <Text style={{ color }}>◫</Text>,
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: locale === 'ka' ? 'სია' : 'Groceries',
          tabBarIcon: ({ color }) => <Text style={{ color }}>✓</Text>,
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: locale === 'ka' ? 'მარაგი' : 'Pantry',
          tabBarIcon: ({ color }) => <Text style={{ color }}>▦</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: locale === 'ka' ? 'პარამეტრები' : 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ color }}>⚙</Text>,
        }}
      />
    </Tabs>
  )
}
