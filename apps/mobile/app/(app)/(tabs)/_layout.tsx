import Ionicons from '@expo/vector-icons/Ionicons'
import { Tabs } from 'expo-router'

import { SufraBottomTabBar } from '@/components/sufra-bottom-tab-bar'
import { colors } from '@/lib/colors'
import { useLocale } from '@/providers/locale-provider'

type TabIconName = 'plan' | 'grocery' | 'pantry' | 'settings'

const tabIcons = {
  plan: 'bar-chart-outline',
  grocery: 'cart-outline',
  pantry: 'cube-outline',
  settings: 'options-outline',
} as const

function tabIcon(name: TabIconName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons color={color} name={tabIcons[name]} size={size} />
  )
}

export default function TabsLayout() {
  const { locale } = useLocale()

  return (
    <Tabs
      tabBar={(props) => <SufraBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="plan"
        options={{
          title: locale === 'ka' ? 'გეგმა' : 'Plan',
          tabBarIcon: tabIcon('plan'),
        }}
      />
      <Tabs.Screen
        name="grocery"
        options={{
          title: locale === 'ka' ? 'სია' : 'Groceries',
          tabBarIcon: tabIcon('grocery'),
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: locale === 'ka' ? 'მარაგი' : 'Pantry',
          tabBarIcon: tabIcon('pantry'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: locale === 'ka' ? 'პარამეტრები' : 'Settings',
          tabBarIcon: tabIcon('settings'),
        }}
      />
    </Tabs>
  )
}
